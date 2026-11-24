import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../config/redis.config.js';
import { prisma } from '../lib/prisma.js';
import { JobStatus } from '@prisma/client';
import { EmailJobData, ScheduleRequestBody, QueueMetricsResponse } from '../types/index.js';
import { ENV } from '../config/env.config.js';

let emailQueueInstance: Queue<EmailJobData> | null = null;

export function getEmailQueue(): Queue<EmailJobData> {
  if (!emailQueueInstance) {
    const queue = new Queue<EmailJobData>('email-queue', {
      connection: redisConnectionOptions as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    });

    queue.on('error', (err: any) => {
      console.warn('⚠️ BullMQ Redis connection warning:', err.message);
    });

    emailQueueInstance = queue;
  }
  return emailQueueInstance;
}

export async function scheduleEmailBatch(params: ScheduleRequestBody) {
  const queue = getEmailQueue();
  const delaySeconds = params.delayBetweenEmails ?? ENV.DEFAULT_DELAY_SECONDS;
  const hourlyLimit = params.hourlyLimit ?? ENV.DEFAULT_HOURLY_LIMIT;
  const startTimeMs = params.startTime ? new Date(params.startTime).getTime() : Date.now();

  // Ensure Sender record exists in DB to prevent foreign key errors
  await prisma.sender.upsert({
    where: { email: params.sender },
    create: {
      email: params.sender,
      name: params.sender.split('@')[0],
      hourlyLimit,
    },
    update: {
      hourlyLimit,
    },
  });

  const createdJobs = [];

  for (let i = 0; i < params.recipients.length; i++) {
    const recipient = params.recipients[i];
    const delayStepMs = i * (delaySeconds * 1000);
    const hourOffsetIndex = Math.floor(i / hourlyLimit);

    // Precise schedule calculation: base start + pacing delay + hourly bucket offset
    const scheduledDate = new Date(startTimeMs + delayStepMs + hourOffsetIndex * 3600 * 1000);
    const hourWindow = scheduledDate.toISOString().slice(0, 13); // e.g. "2026-11-24T23"
    const delayFromNow = Math.max(0, scheduledDate.getTime() - Date.now());

    // 1. Create EmailJob record in database
    const dbJob = await prisma.emailJob.create({
      data: {
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
      },
    });

    // 2. Add delayed job to BullMQ queue
    try {
      const bullJob = await queue.add(
        'send-email',
        {
          jobDbId: dbJob.id,
          senderEmail: params.sender,
          recipient,
          subject: params.subject,
          body: params.body,
          scheduledTime: scheduledDate.toISOString(),
          delaySeconds,
          hourlyLimit,
          hourWindow,
        },
        {
          delay: delayFromNow,
          jobId: `job_${dbJob.id}`,
        }
      );

      await prisma.emailJob.update({
        where: { id: dbJob.id },
        data: { bullJobId: bullJob.id },
      });
    } catch (err: any) {
      console.warn(`BullMQ queue offline for job ${dbJob.id}:`, err.message);
    }

    createdJobs.push(dbJob);
  }

  return createdJobs;
}

export async function cancelJob(jobId: string) {
  try {
    const queue = getEmailQueue();
    const bullJob = await queue.getJob(`job_${jobId}`);
    if (bullJob) {
      await bullJob.remove();
    }
  } catch {
    // BullMQ may be offline or job already completed
  }

  return await prisma.emailJob.update({
    where: { id: jobId },
    data: { status: JobStatus.CANCELLED },
  });
}

export async function getQueueMetrics(): Promise<QueueMetricsResponse> {
  try {
    const queue = getEmailQueue();
    const [waiting, active, delayed, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getDelayedCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);

    const [dbScheduled, dbDelayed, dbSent, dbFailed] = await Promise.all([
      prisma.emailJob.count({ where: { status: JobStatus.SCHEDULED } }),
      prisma.emailJob.count({ where: { status: JobStatus.DELAYED } }),
      prisma.emailJob.count({ where: { status: JobStatus.SENT } }),
      prisma.emailJob.count({ where: { status: JobStatus.FAILED } }),
    ]);

    return {
      waiting: Math.max(waiting, dbScheduled),
      active,
      delayed: Math.max(delayed, dbDelayed),
      completed: Math.max(completed, dbSent),
      failed: Math.max(failed, dbFailed),
    };
  } catch {
    const [dbScheduled, dbDelayed, dbSent, dbFailed] = await Promise.all([
      prisma.emailJob.count({ where: { status: JobStatus.SCHEDULED } }),
      prisma.emailJob.count({ where: { status: JobStatus.DELAYED } }),
      prisma.emailJob.count({ where: { status: JobStatus.SENT } }),
      prisma.emailJob.count({ where: { status: JobStatus.FAILED } }),
    ]);

    return {
      waiting: dbScheduled,
      active: 0,
      delayed: dbDelayed,
      completed: dbSent,
      failed: dbFailed,
    };
  }
}
