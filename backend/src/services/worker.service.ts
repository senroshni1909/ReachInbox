import { Worker, Job } from 'bullmq';
import { redisConnectionOptions } from '../config/redis.config.js';
import { EmailJobData } from '../types/index.js';
import { sendEmail } from './email.service.js';
import { prisma } from '../lib/prisma.js';
import { JobStatus } from '@prisma/client';
import { checkRateLimitAndAlert } from './slack.service.js';
import { ENV } from '../config/env.config.js';

let emailWorkerInstance: Worker<EmailJobData> | null = null;

export function initEmailWorker(): Worker<EmailJobData> {
  if (emailWorkerInstance) return emailWorkerInstance;

  emailWorkerInstance = new Worker<EmailJobData>(
    'email-queue',
    async (job: Job<EmailJobData>) => {
      const { jobDbId, senderEmail, recipient, subject, body, hourWindow, hourlyLimit } = job.data;

      // 1. Mark as PROCESSING in database
      await prisma.emailJob.update({
        where: { id: jobDbId },
        data: { status: JobStatus.PROCESSING },
      });

      // 2. Track & update hourly limit counter
      await prisma.hourlyRateLimitTracker.upsert({
        where: {
          senderEmail_hourWindow: {
            senderEmail,
            hourWindow,
          },
        },
        create: {
          senderEmail,
          hourWindow,
          sentCount: 1,
          limit: hourlyLimit,
        },
        update: {
          sentCount: { increment: 1 },
        },
      });

      // 3. Check rate-limit alert threshold for Slack
      await checkRateLimitAndAlert(senderEmail, hourWindow, hourlyLimit);

      // 4. Send email via Ethereal SMTP
      const sendResult = await sendEmail({
        from: senderEmail,
        to: recipient,
        subject,
        body,
      });

      if (!sendResult.success) {
        await prisma.emailJob.update({
          where: { id: jobDbId },
          data: {
            status: JobStatus.FAILED,
            errorMessage: sendResult.error || 'Failed to dispatch email via SMTP',
            attempts: { increment: 1 },
          },
        });
        throw new Error(sendResult.error || 'Failed to dispatch email via SMTP');
      }

      // 5. Update success state in database with Ethereal preview URL
      await prisma.emailJob.update({
        where: { id: jobDbId },
        data: {
          status: JobStatus.SENT,
          sentTime: new Date(),
          etherealUrl: sendResult.etherealUrl,
          messageId: sendResult.messageId,
          attempts: { increment: 1 },
        },
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
    console.log(`✅ [BullMQ Worker] Job ${job.id} dispatched successfully to ${job.data.recipient}.`);
  });

  emailWorkerInstance.on('failed', (job, err) => {
    console.error(`❌ [BullMQ Worker] Job ${job?.id} failed:`, err.message);
  });

  return emailWorkerInstance;
}
