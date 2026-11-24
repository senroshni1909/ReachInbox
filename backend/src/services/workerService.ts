import { Worker, Job } from 'bullmq';
import { redisConnectionOptions } from '../config/redis.js';
import { EmailJobData } from './queueService.js';
import { sendEmail } from './emailService.js';
import { prisma } from '../lib/prisma.js';
import { JobStatus } from '@prisma/client';
import { checkRateLimitAndAlert } from './slackService.js';

let emailWorker: Worker<EmailJobData> | null = null;

export function initEmailWorker() {
  if (emailWorker) return emailWorker;

  emailWorker = new Worker<EmailJobData>(
    'email-queue',
    async (job: Job<EmailJobData>) => {
      const { jobDbId, senderEmail, recipient, subject, body, hourWindow, hourlyLimit } = job.data;

      // 1. Mark as PROCESSING in DB
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

      // 3. Check rate-limit alert threshold
      await checkRateLimitAndAlert(senderEmail, hourWindow, hourlyLimit);

      // 4. Send email via SMTP / Ethereal
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
            errorMessage: sendResult.error || 'Failed to dispatch email',
            attempts: { increment: 1 },
          },
        });
        throw new Error(sendResult.error || 'Failed to dispatch email');
      }

      // 5. Update success state in database
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
      concurrency: 5,
    }
  );

  emailWorker.on('completed', job => {
    console.log(`✅ [BullMQ] Job ${job.id} sent successfully.`);
  });

  emailWorker.on('failed', (job, err) => {
    console.error(`❌ [BullMQ] Job ${job?.id} failed:`, err.message);
  });

  return emailWorker;
}
