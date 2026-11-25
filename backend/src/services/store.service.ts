import { prisma } from '../lib/prisma.js';
import { JobStatus, Prisma, EmailJob } from '@prisma/client';
import { FormattedEmailJob } from '../types/index.js';

export type EmailJobEntity = EmailJob;

export const StoreService = {
  /**
   * Ensure sender domain/account exists in relational DB
   */
  async ensureSender(email: string, hourlyLimit: number): Promise<void> {
    await prisma.sender.upsert({
      where: { email },
      create: { email, name: email.split('@')[0], hourlyLimit },
      update: { hourlyLimit },
    });
  },

  /**
   * Create and store email job in PostgreSQL
   */
  async createJob(data: {
    recipient: string;
    recipientName?: string;
    subject: string;
    body: string;
    senderEmail: string;
    scheduledTime: Date;
    delaySeconds: number;
    hourlyLimit: number;
    hourWindow?: string;
    userId?: string;
    status: JobStatus;
    attachments?: any;
  }) {
    return await prisma.emailJob.create({
      data: {
        recipient: data.recipient,
        recipientName: data.recipientName,
        subject: data.subject,
        body: data.body,
        senderEmail: data.senderEmail,
        scheduledTime: data.scheduledTime,
        status: data.status,
        delaySeconds: data.delaySeconds,
        hourlyLimit: data.hourlyLimit,
        hourWindow: data.hourWindow,
        userId: data.userId,
        attachments: data.attachments ?? undefined,
      },
    });
  },

  /**
   * Update an existing job in PostgreSQL
   */
  async updateJob(id: string, updates: Prisma.EmailJobUpdateInput) {
    return await prisma.emailJob.update({
      where: { id },
      data: updates,
    });
  },

  /**
   * Delete job permanently from PostgreSQL (or mark cancelled)
   */
  async deleteJob(id: string) {
    try {
      return await prisma.emailJob.delete({
        where: { id },
      });
    } catch {
      return await prisma.emailJob.update({
        where: { id },
        data: { status: JobStatus.CANCELLED },
      });
    }
  },

  /**
   * Get single email by ID from PostgreSQL
   */
  async getJobById(id: string) {
    return await prisma.emailJob.findUnique({
      where: { id },
    });
  },

  /**
   * Query scheduled emails from PostgreSQL
   */
  async getScheduled(params?: { q?: string; sender?: string; status?: string }) {
    const where: Prisma.EmailJobWhereInput = {
      status: { in: [JobStatus.SCHEDULED, JobStatus.DELAYED, JobStatus.PROCESSING] },
    };

    if (params?.sender && params.sender !== 'all') {
      where.senderEmail = params.sender;
    }

    if (params?.status && params.status !== 'all') {
      where.status = params.status as JobStatus;
    }

    if (params?.q) {
      where.OR = [
        { recipient: { contains: params.q, mode: 'insensitive' } },
        { subject: { contains: params.q, mode: 'insensitive' } },
        { body: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    const [emails, total] = await Promise.all([
      prisma.emailJob.findMany({ where, orderBy: { scheduledTime: 'asc' } }),
      prisma.emailJob.count({ where }),
    ]);

    return { emails, total };
  },

  /**
   * Query sent emails from PostgreSQL
   */
  async getSent(params?: { q?: string; sender?: string; status?: string }) {
    const where: Prisma.EmailJobWhereInput = {
      status: { in: [JobStatus.SENT, JobStatus.FAILED] },
    };

    if (params?.sender && params.sender !== 'all') {
      where.senderEmail = params.sender;
    }

    if (params?.status && params.status !== 'all') {
      where.status = params.status as JobStatus;
    }

    if (params?.q) {
      where.OR = [
        { recipient: { contains: params.q, mode: 'insensitive' } },
        { subject: { contains: params.q, mode: 'insensitive' } },
        { body: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    const [emails, total] = await Promise.all([
      prisma.emailJob.findMany({ where, orderBy: { sentTime: 'desc' } }),
      prisma.emailJob.count({ where }),
    ]);

    return { emails, total };
  },

  /**
   * Count email jobs directly from PostgreSQL
   */
  async getCounts() {
    const [waiting, delayed, completed, failed] = await Promise.all([
      prisma.emailJob.count({ where: { status: JobStatus.SCHEDULED } }),
      prisma.emailJob.count({ where: { status: JobStatus.DELAYED } }),
      prisma.emailJob.count({ where: { status: JobStatus.SENT } }),
      prisma.emailJob.count({ where: { status: JobStatus.FAILED } }),
    ]);

    return {
      waiting,
      active: 0,
      delayed,
      completed,
      failed,
    };
  },
};

export function formatJobToDto(e: any): FormattedEmailJob {
  return {
    id: e.id,
    recipient: e.recipient,
    recipientName: e.recipientName || undefined,
    subject: e.subject,
    body: e.body,
    sender: e.senderEmail,
    scheduledTime: e.scheduledTime instanceof Date ? e.scheduledTime.toISOString() : String(e.scheduledTime),
    sentTime: e.sentTime ? (e.sentTime instanceof Date ? e.sentTime.toISOString() : String(e.sentTime)) : undefined,
    status: typeof e.status === 'string' ? e.status.toLowerCase() : String(e.status).toLowerCase(),
    delaySeconds: e.delaySeconds,
    delayBetweenEmails: e.delaySeconds,
    hourlyLimit: e.hourlyLimit,
    etherealUrl: e.etherealUrl || undefined,
    createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
    attachments: e.attachments ? (Array.isArray(e.attachments) ? e.attachments : JSON.parse(e.attachments)) : [],
  };
}
