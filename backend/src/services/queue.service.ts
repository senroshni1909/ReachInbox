import { Queue } from 'bullmq';
import { redisConnectionOptions, isRedisOnline, getRedisClient } from '../config/redis.config.js';
import { JobStatus } from '@prisma/client';
import { EmailJobData, ScheduleRequestBody, QueueMetricsResponse } from '../types/index.js';
import { ENV } from '../config/env.config.js';
import { StoreService, EmailJobEntity } from './store.service.js';
import { sendEmail } from './email.service.js';

let emailQueueInstance: Queue<EmailJobData> | null = null;

export async function getEmailQueue(): Promise<Queue<EmailJobData> | null> {
  const online = await isRedisOnline();
  if (!online) return null;

  if (!emailQueueInstance) {
    try {
      const queue = new Queue<EmailJobData>('email-queue', {
        connection: redisConnectionOptions as any,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: false,
          removeOnFail: false,
        },
      });

      queue.on('error', (err: any) => {
        // Suppress unhandled redis errors
      });

      emailQueueInstance = queue;
    } catch {
      return null;
    }
  }
  return emailQueueInstance;
}

// Executes an email job immediately or when its scheduled timer fires
async function processEmailDispatch(job: EmailJobEntity) {
  try {
    await StoreService.updateJob(job.id, { status: JobStatus.PROCESSING });

    console.log(`📨 [Ethereal SMTP] Dispatching scheduled email to ${job.recipient}...`);
    const result = await sendEmail({
      from: job.senderEmail,
      to: job.recipient,
      subject: job.subject,
      body: job.body,
    });

    if (result.success) {
      await StoreService.updateJob(job.id, {
        status: JobStatus.SENT,
        sentTime: new Date(),
        etherealUrl: result.etherealUrl,
        messageId: result.messageId,
      });
      console.log(`✅ [Ethereal SMTP] Delivered to ${job.recipient}!`);
      if (result.etherealUrl) {
        console.log(`🔗 [Ethereal Preview URL]: ${result.etherealUrl}`);
      }
    } else {
      await StoreService.updateJob(job.id, {
        status: JobStatus.FAILED,
        errorMessage: result.error,
      });
    }
  } catch (err: any) {
    console.error(`❌ [Dispatch Error]:`, err.message);
  }
}

export async function scheduleEmailBatch(params: ScheduleRequestBody) {
  const delaySeconds = params.delayBetweenEmails ?? ENV.DEFAULT_DELAY_SECONDS;
  const hourlyLimit = params.hourlyLimit ?? ENV.DEFAULT_HOURLY_LIMIT;
  const startTimeMs = params.startTime ? new Date(params.startTime).getTime() : Date.now();

  await StoreService.ensureSender(params.sender, hourlyLimit);

  const createdJobs: EmailJobEntity[] = [];
  const queue = await getEmailQueue();

  for (let i = 0; i < params.recipients.length; i++) {
    const recipient = params.recipients[i];
    const delayStepMs = i * (delaySeconds * 1000);
    const hourOffsetIndex = Math.floor(i / hourlyLimit);

    const scheduledDate = new Date(startTimeMs + delayStepMs + hourOffsetIndex * 3600 * 1000);
    const hourWindow = scheduledDate.toISOString().slice(0, 13);
    const delayFromNow = Math.max(0, scheduledDate.getTime() - Date.now());

    // 1. Persist to store
    const dbJob = await StoreService.createJob({
      recipient,
      senderEmail: params.sender,
      subject: params.subject,
      body: params.body,
      scheduledTime: scheduledDate,
      delaySeconds,
      hourlyLimit,
      hourWindow,
      status: hourOffsetIndex > 0 ? JobStatus.DELAYED : JobStatus.SCHEDULED,
      userId: params.userId,
    });

    // Structured Date and Time values for Redis storage
    const scheduledAtISO = scheduledDate.toISOString();
    const scheduledAtUTC = scheduledDate.toUTCString();
    const scheduledTimestamp = scheduledDate.getTime();
    const scheduledDateFormatted = scheduledDate.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    const createdAtISO = new Date().toISOString();

    // 2. Queue execution: Attempt BullMQ first, seamlessly fall back to local in-process timer
    let queuedViaBullMq = false;
    if (queue) {
      try {
        const bullJob = await queue.add(
          'send-email',
          {
            jobDbId: dbJob.id,
            senderEmail: params.sender,
            recipient,
            subject: params.subject,
            body: params.body,
            scheduledTime: scheduledAtISO,
            scheduledAtISO,
            scheduledAtUTC,
            scheduledTimestamp,
            scheduledDateFormatted,
            createdAtISO,
            delaySeconds,
            delayMs: delayFromNow,
            hourlyLimit,
            hourWindow,
          },
          {
            delay: delayFromNow,
            jobId: `job_${dbJob.id}`,
            timestamp: Date.now(),
          }
        );
        await StoreService.updateJob(dbJob.id, { bullJobId: bullJob.id });
        queuedViaBullMq = true;
      } catch {
        queuedViaBullMq = false;
      }
    }

    // 3. Persist exact date/time in Redis Hash and Sorted Set for fast inspection
    const redis = await getRedisClient();
    if (redis) {
      try {
        await redis.hset(`job:schedule:${dbJob.id}`, {
          id: dbJob.id,
          recipient,
          senderEmail: params.sender,
          subject: params.subject,
          scheduledAtISO,
          scheduledAtUTC,
          scheduledTimestamp: String(scheduledTimestamp),
          scheduledDateFormatted,
          delayMs: String(delayFromNow),
          status: 'scheduled',
          createdAtISO,
        });

        // Store by timestamp score in Redis Sorted Set: Score = Unix ms of scheduled execution
        await redis.zadd('jobs:by_scheduled_time', scheduledTimestamp, dbJob.id);
      } catch {
        // Ignore if Redis write fails
      }
    }

    if (!queuedViaBullMq) {
      // In-process timer fallback: triggers actual delivery via Ethereal SMTP
      setTimeout(() => {
        processEmailDispatch(dbJob);
      }, delayFromNow);
    }

    createdJobs.push(dbJob);
  }

  return createdJobs;
}

export async function cancelJob(jobId: string) {
  const queue = await getEmailQueue();
  if (queue) {
    try {
      const bullJob = await queue.getJob(`job_${jobId}`);
      if (bullJob) await bullJob.remove();
    } catch {
      // Ignore
    }
  }

  const redis = await getRedisClient();
  if (redis) {
    try {
      await redis.hset(`job:schedule:${jobId}`, 'status', 'cancelled');
      await redis.zrem('jobs:by_scheduled_time', jobId);
    } catch {
      // Ignore
    }
  }

  return await StoreService.updateJob(jobId, { status: JobStatus.CANCELLED });
}

export async function getQueueMetrics(): Promise<QueueMetricsResponse> {
  return await StoreService.getCounts();
}
