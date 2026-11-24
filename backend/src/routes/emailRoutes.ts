import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { scheduleEmailBatch, cancelJob } from '../services/queueService.js';
import { JobStatus, Prisma } from '@prisma/client';

export const emailRouter = Router();

// GET /api/emails/scheduled
emailRouter.get('/scheduled', async (req: Request, res: Response): Promise<void> => {
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

    // Format fields to match frontend interface
    const mapped = emails.map(e => ({
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
});

// GET /api/emails/sent
emailRouter.get('/sent', async (req: Request, res: Response): Promise<void> => {
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

    const mapped = emails.map(e => ({
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
});

// POST /api/emails/schedule
emailRouter.post('/schedule', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sender, recipients, subject, body, startTime, delayBetweenEmails, hourlyLimit } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      res.status(400).json({ error: 'Recipients list is required.' });
      return;
    }

    if (!subject || !subject.trim()) {
      res.status(400).json({ error: 'Email subject is required.' });
      return;
    }

    const jobs = await scheduleEmailBatch({
      sender: sender || 'outreach@reachinbox.ai',
      recipients,
      subject,
      body: body || '',
      startTime: startTime || new Date().toISOString(),
      delayBetweenEmails: Number(delayBetweenEmails) || 2,
      hourlyLimit: Number(hourlyLimit) || 50,
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
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to schedule emails' });
  }
});

// DELETE /api/emails/scheduled/:id
emailRouter.delete('/scheduled/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    await cancelJob(Array.isArray(id) ? id[0] : id);
    res.json({ success: true, message: 'Job cancelled successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to cancel job' });
  }
});
