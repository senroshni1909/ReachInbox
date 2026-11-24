import { Worker, Job } from 'bullmq';
import { redisConnectionOptions, isRedisOnline } from '../config/redis.config.js';
import { EmailJobData } from '../types/index.js';
import { sendEmail } from './email.service.js';
import { StoreService } from './store.service.js';
import { JobStatus } from '@prisma/client';
import { checkRateLimitAndAlert } from './slack.service.js';
import { ENV } from '../config/env.config.js';

let emailWorkerInstance: Worker<EmailJobData> | null = null;

export async function initEmailWorker(): Promise<Worker<EmailJobData> | null> {
  const redisAvailable = await isRedisOnline();
  if (!redisAvailable) {
    console.log('ℹ️ [Worker] Redis offline at localhost:6379. BullMQ worker paused; using in-memory timer engine.');
    return null;
  }

  if (emailWorkerInstance) return emailWorkerInstance;

  try {
    emailWorkerInstance = new Worker<EmailJobData>(
      'email-queue',
      async (job: Job<EmailJobData>) => {
        const { jobDbId, senderEmail, recipient, subject, body, hourWindow, hourlyLimit } = job.data;

        await StoreService.updateJob(jobDbId, { status: JobStatus.PROCESSING });
        await checkRateLimitAndAlert(senderEmail, hourWindow, hourlyLimit);

        const sendResult = await sendEmail({
          from: senderEmail,
          to: recipient,
          subject,
          body,
        });

        if (!sendResult.success) {
          await StoreService.updateJob(jobDbId, {
            status: JobStatus.FAILED,
            errorMessage: sendResult.error || 'Failed to dispatch email via SMTP',
          });
          throw new Error(sendResult.error || 'Failed to dispatch email via SMTP');
        }

        await StoreService.updateJob(jobDbId, {
          status: JobStatus.SENT,
          sentTime: new Date(),
          etherealUrl: sendResult.etherealUrl,
          messageId: sendResult.messageId,
        });

        return {
          messageId: sendResult.messageId,
          etherealUrl: sendResult.etherealUrl,
        };
      },
      {
        connection: redisConnectionOptions as any,
        concurrency: ENV.WORKER_CONCURRENCY,
      }
    );

    emailWorkerInstance.on('completed', job => {
      console.log(`✅ [BullMQ Worker] Job ${job.id} dispatched to ${job.data.recipient}.`);
    });

    emailWorkerInstance.on('error', err => {
      // Catch worker-level connection errors
      console.warn('BullMQ Worker connection warning:', err.message);
    });

    return emailWorkerInstance;
  } catch (err: any) {
    console.warn('BullMQ Worker initialization skipped:', err.message);
    return null;
  }
}
