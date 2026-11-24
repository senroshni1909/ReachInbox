import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { scheduleEmailBatch, cancelJob } from '../services/queue.service.js';
import { JobStatus, Prisma } from '@prisma/client';
import { FormattedEmailJob } from '../types/index.js';

export class EmailController {
  /**
   * POST /api/emails/schedule
   * Schedules batch of emails with delay pacing and hourly limit constraints
   */
  static async scheduleEmails(req: Request, res: Response): Promise<void> {
    try {
      const { sender, recipients, subject, body, startTime, delayBetweenEmails, hourlyLimit, userId } = req.body;

      const jobs = await scheduleEmailBatch({
        sender,
        recipients,
        subject,
        body,
        startTime,
        delayBetweenEmails,
        hourlyLimit,
        userId,
      });

      res.status(201).json({
        success: true,
        scheduledCount: jobs.length,
        jobs: jobs.map(j => ({
          id: j.id,
          recipient: j.recipient,
          sender: j.senderEmail,
          subject: j.subject,
          body: j.body,
          scheduledTime: j.scheduledTime.toISOString(),
          status: j.status.toLowerCase(),
          delaySeconds: j.delaySeconds,
          hourlyLimit: j.hourlyLimit,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to schedule emails' });
    }
  }

  /**
   * GET /api/emails/scheduled
   */
  static async getScheduledEmails(req: Request, res: Response): Promise<void> {
    try {
      const { q, sender, status } = req.query;

      const where: Prisma.EmailJobWhereInput = {
        status: {
          in: [JobStatus.SCHEDULED, JobStatus.DELAYED, JobStatus.PROCESSING],
        },
      };

      if (sender && sender !== 'all') {
        where.senderEmail = String(sender);
      }

      if (status && status !== 'all') {
        where.status = status as JobStatus;
      }

      if (q) {
        const searchStr = String(q);
        where.OR = [
          { recipient: { contains: searchStr, mode: 'insensitive' } },
          { subject: { contains: searchStr, mode: 'insensitive' } },
          { body: { contains: searchStr, mode: 'insensitive' } },
        ];
      }

      const [emails, total] = await Promise.all([
        prisma.emailJob.findMany({
          where,
          orderBy: { scheduledTime: 'asc' },
        }),
        prisma.emailJob.count({ where }),
      ]);

      const mapped: FormattedEmailJob[] = emails.map(e => ({
        id: e.id,
        recipient: e.recipient,
        recipientName: e.recipientName || undefined,
        subject: e.subject,
        body: e.body,
        sender: e.senderEmail,
        scheduledTime: e.scheduledTime.toISOString(),
        sentTime: e.sentTime ? e.sentTime.toISOString() : undefined,
        status: e.status.toLowerCase(),
        delaySeconds: e.delaySeconds,
        delayBetweenEmails: e.delaySeconds,
        hourlyLimit: e.hourlyLimit,
        etherealUrl: e.etherealUrl || undefined,
        createdAt: e.createdAt.toISOString(),
      }));

      res.json({ emails: mapped, total });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch scheduled emails' });
    }
  }

  /**
   * GET /api/emails/sent
   */
  static async getSentEmails(req: Request, res: Response): Promise<void> {
    try {
      const { q, sender, status } = req.query;

      const where: Prisma.EmailJobWhereInput = {
        status: {
          in: [JobStatus.SENT, JobStatus.FAILED],
        },
      };

      if (sender && sender !== 'all') {
        where.senderEmail = String(sender);
      }

      if (status && status !== 'all') {
        where.status = status as JobStatus;
      }

      if (q) {
        const searchStr = String(q);
        where.OR = [
          { recipient: { contains: searchStr, mode: 'insensitive' } },
          { subject: { contains: searchStr, mode: 'insensitive' } },
          { body: { contains: searchStr, mode: 'insensitive' } },
        ];
      }

      const [emails, total] = await Promise.all([
        prisma.emailJob.findMany({
          where,
          orderBy: { sentTime: 'desc' },
        }),
        prisma.emailJob.count({ where }),
      ]);

      const mapped: FormattedEmailJob[] = emails.map(e => ({
        id: e.id,
        recipient: e.recipient,
        recipientName: e.recipientName || undefined,
        subject: e.subject,
        body: e.body,
        sender: e.senderEmail,
        scheduledTime: e.scheduledTime.toISOString(),
        sentTime: e.sentTime ? e.sentTime.toISOString() : undefined,
        status: e.status.toLowerCase(),
        delaySeconds: e.delaySeconds,
        delayBetweenEmails: e.delaySeconds,
        hourlyLimit: e.hourlyLimit,
        etherealUrl: e.etherealUrl || undefined,
        createdAt: e.createdAt.toISOString(),
      }));

      res.json({ emails: mapped, total });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch sent emails' });
    }
  }

  /**
   * DELETE /api/emails/scheduled/:id
   */
  static async cancelScheduledEmail(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const targetId = Array.isArray(id) ? id[0] : id;
      await cancelJob(targetId);
      res.json({ success: true, message: 'Job cancelled successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to cancel job' });
    }
  }
}
