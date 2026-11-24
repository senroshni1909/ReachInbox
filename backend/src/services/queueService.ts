import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../config/redis.js';
import { prisma } from '../lib/prisma.js';
import { JobStatus } from '@prisma/client';

export interface EmailJobData {
  jobDbId: string;
  senderEmail: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledTime: string;
  delaySeconds: number;
  hourlyLimit: number;
  hourWindow: string;
}

let emailQueue: Queue<any> | null = null;

export function getEmailQueue(): Queue<any> {
  if (!emailQueue) {
    const queue = new Queue('email-queue', {
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

    emailQueue = queue;
  }
  return emailQueue;
}

export interface ScheduleBatchParams {
  sender: string;
  recipients: string[];
  subject: string;
  body: string;
  startTime: string;
  delayBetweenEmails: number;
  hourlyLimit: number;
  userId?: string;
}

export async function scheduleEmailBatch(params: ScheduleBatchParams) {
  const queue = getEmailQueue();
  const startTimeMs = new Date(params.startTime).getTime();
  const createdJobs = [];

  for (let i = 0; i < params.recipients.length; i++) {
    const recipient = params.recipients[i];
    const delayStepMs = i * (params.delayBetweenEmails * 1000);
    const hourOffsetIndex = Math.floor(i / params.hourlyLimit);

    // Date calculation respecting rate limits across hourly windows
    const scheduledDate = new Date(startTimeMs + delayStepMs + hourOffsetIndex * 3600 * 1000);
    const hourWindow = scheduledDate.toISOString().slice(0, 13); // e.g. "2026-11-24T23"
    const delayFromNow = Math.max(0, scheduledDate.getTime() - Date.now());

    // 1. Create Job in database
    const dbJob = await prisma.emailJob.create({
      data: {
        recipient,
        senderEmail: params.sender,
        subject: params.subject,
        body: params.body,
        scheduledTime: scheduledDate,
        delaySeconds: params.delayBetweenEmails,
        hourlyLimit: params.hourlyLimit,
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
          delaySeconds: params.delayBetweenEmails,
          hourlyLimit: params.hourlyLimit,
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
  // Remove from BullMQ if present
  try {
    const queue = getEmailQueue();
    const bullJob = await queue.getJob(`job_${jobId}`);
    if (bullJob) {
      await bullJob.remove();
    }
  } catch {
    // Ignore queue failure
  }

  // Update DB status or remove
  return await prisma.emailJob.update({
    where: { id: jobId },
    data: { status: JobStatus.CANCELLED },
  });
}

export async function getQueueMetrics() {
  try {
    const queue = getEmailQueue();
    const [waiting, active, delayed, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getDelayedCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);

    // Also get database counts to ensure dynamic accuracy
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
    // Fallback directly to Prisma database counts
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
