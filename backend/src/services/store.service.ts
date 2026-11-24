import { prisma } from '../lib/prisma.js';
import { JobStatus } from '@prisma/client';

export interface EmailJobEntity {
  id: string;
  bullJobId?: string;
  recipient: string;
  recipientName?: string;
  subject: string;
  body: string;
  senderEmail: string;
  scheduledTime: Date;
  sentTime?: Date | null;
  status: JobStatus;
  delaySeconds: number;
  hourlyLimit: number;
  hourWindow?: string;
  attempts: number;
  maxAttempts: number;
  errorMessage?: string;
  etherealUrl?: string;
  messageId?: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-Memory fallback store with initial data so app works immediately even if Postgres is offline
const memoryJobs: EmailJobEntity[] = [
  {
    id: 'job_sched_01',
    recipient: 'john.smith@acme.com',
    recipientName: 'John Smith',
    subject: 'Meeting follow-up - Scheduled',
    body: 'Hi John, just wanted to follow up on our meeting and discuss the next milestones for the outbound campaign.',
    senderEmail: 'oliver.brown@domain.io',
    scheduledTime: new Date(Date.now() + 15 * 60 * 1000),
    status: JobStatus.SCHEDULED,
    hourlyLimit: 50,
    delaySeconds: 3,
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'job_sched_02',
    recipient: 'olive@designcraft.io',
    recipientName: 'Olive',
    subject: "Ramit, great to meet you - you'll love it",
    body: 'Hi Olive, just wanted to follow up on our meeting and send over the platform demo walkthrough.',
    senderEmail: 'oliver.brown@domain.io',
    scheduledTime: new Date(Date.now() + 45 * 60 * 1000),
    status: JobStatus.SCHEDULED,
    hourlyLimit: 60,
    delaySeconds: 4,
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date(Date.now() - 25 * 60 * 1000),
    updatedAt: new Date(Date.now() - 25 * 60 * 1000),
  },
  {
    id: 'job_sched_03',
    recipient: 'elena.rostova@techscale.co',
    recipientName: 'Elena Rostova',
    subject: 'Scaling cold outreach with AI workflows for TechScale',
    body: 'Hi Elena,\n\nSaw TechScale is expanding its outbound sales team. ReachInbox automates verified lead enrichment.\n\nBest,\nOliver',
    senderEmail: 'oliver.brown@domain.io',
    scheduledTime: new Date(Date.now() + 110 * 60 * 1000),
    status: JobStatus.DELAYED,
    hourlyLimit: 40,
    delaySeconds: 2,
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date(Date.now() - 50 * 60 * 1000),
    updatedAt: new Date(Date.now() - 50 * 60 * 1000),
  },
  {
    id: 'job_sched_04',
    recipient: 'arthur.pendelton@apexventures.com',
    recipientName: 'Arthur Pendelton',
    subject: 'AI-driven lead sequencing platform introduction',
    body: 'Arthur, wanted to put ReachInbox on your radar following your syndicate announcement in enterprise B2B sales automation.',
    senderEmail: 'oliver.brown@domain.io',
    scheduledTime: new Date(Date.now() + 180 * 60 * 1000),
    status: JobStatus.SCHEDULED,
    hourlyLimit: 50,
    delaySeconds: 5,
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: 'job_sent_01',
    recipient: 'ceo@datacraft.ai',
    recipientName: 'Jonathan Hayes',
    subject: 'ReachInbox AI cold outreach benchmark report',
    body: 'Hi Jonathan,\n\nWe prepared a custom lead conversion benchmark for DataCraft.',
    senderEmail: 'oliver.brown@domain.io',
    scheduledTime: new Date(Date.now() - 120 * 60 * 1000),
    sentTime: new Date(Date.now() - 118 * 60 * 1000),
    status: JobStatus.SENT,
    delaySeconds: 2,
    hourlyLimit: 100,
    etherealUrl: 'https://ethereal.email/message/WaQKMgKddxQDoWBcWaQKMgKddxQDoWBd',
    messageId: '<dc8319-ethereal-9104@domain.io>',
    attempts: 1,
    maxAttempts: 3,
    createdAt: new Date(Date.now() - 140 * 60 * 1000),
    updatedAt: new Date(Date.now() - 118 * 60 * 1000),
  },
  {
    id: 'job_sent_02',
    recipient: 'charlie.wu@cloudnexus.org',
    recipientName: 'Charlie Wu',
    subject: 'Transforming outbound sales with Outbox Labs',
    body: 'Hello Charlie,\n\nSending you a quick preview of how CloudNexus can trigger personalized multi-step emails on demand.',
    senderEmail: 'oliver.brown@domain.io',
    scheduledTime: new Date(Date.now() - 75 * 60 * 1000),
    sentTime: new Date(Date.now() - 74 * 60 * 1000),
    status: JobStatus.SENT,
    delaySeconds: 3,
    hourlyLimit: 50,
    etherealUrl: 'https://ethereal.email/message/ZaOKMgKddxQDoWBcZaOKMgKddxQDoWBe',
    messageId: '<89af10-ethereal-7712@domain.io>',
    attempts: 1,
    maxAttempts: 3,
    createdAt: new Date(Date.now() - 90 * 60 * 1000),
    updatedAt: new Date(Date.now() - 74 * 60 * 1000),
  },
  {
    id: 'job_sent_03',
    recipient: 'invalid-address@bouncetest.invalid',
    subject: 'Test delivery for SMTP bounce simulator',
    body: 'This email tested recipient server bounce simulation.',
    senderEmail: 'oliver.brown@domain.io',
    scheduledTime: new Date(Date.now() - 40 * 60 * 1000),
    sentTime: new Date(Date.now() - 39 * 60 * 1000),
    status: JobStatus.FAILED,
    delaySeconds: 2,
    hourlyLimit: 50,
    errorMessage: 'SMTP 550 5.1.1: Recipient address rejected',
    attempts: 1,
    maxAttempts: 3,
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    updatedAt: new Date(Date.now() - 39 * 60 * 1000),
  },
];

let isPrismaAvailable: boolean | null = null;

async function checkPrisma(): Promise<boolean> {
  if (isPrismaAvailable !== null) return isPrismaAvailable;
  try {
    await prisma.$queryRaw`SELECT 1`;
    isPrismaAvailable = true;
    console.log('✅ PostgreSQL connected successfully via Prisma.');
  } catch {
    isPrismaAvailable = false;
    console.log('ℹ️ PostgreSQL is offline. Seamlessly utilizing in-memory persistence store.');
  }
  return isPrismaAvailable;
}

export const StoreService = {
  async ensureSender(email: string, hourlyLimit: number): Promise<void> {
    const hasDb = await checkPrisma();
    if (hasDb) {
      try {
        await prisma.sender.upsert({
          where: { email },
          create: { email, name: email.split('@')[0], hourlyLimit },
          update: { hourlyLimit },
        });
      } catch {
        // Fallback
      }
    }
  },

  async createJob(job: Omit<EmailJobEntity, 'id' | 'createdAt' | 'updatedAt' | 'attempts' | 'maxAttempts'>): Promise<EmailJobEntity> {
    const hasDb = await checkPrisma();
    if (hasDb) {
      try {
        const created = await prisma.emailJob.create({
          data: {
            recipient: job.recipient,
            recipientName: job.recipientName,
            subject: job.subject,
            body: job.body,
            senderEmail: job.senderEmail,
            scheduledTime: job.scheduledTime,
            status: job.status,
            delaySeconds: job.delaySeconds,
            hourlyLimit: job.hourlyLimit,
            hourWindow: job.hourWindow,
            userId: job.userId,
          },
        });
        return created as unknown as EmailJobEntity;
      } catch (err) {
        console.warn('Prisma create failed, falling back to memory store:', err);
      }
    }

    const newJob: EmailJobEntity = {
      ...job,
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryJobs.unshift(newJob);
    return newJob;
  },

  async updateJob(id: string, updates: Partial<EmailJobEntity>): Promise<EmailJobEntity | null> {
    const hasDb = await checkPrisma();
    if (hasDb) {
      try {
        const updated = await prisma.emailJob.update({
          where: { id },
          data: updates as any,
        });
        return updated as unknown as EmailJobEntity;
      } catch {
        // Fallback
      }
    }

    const index = memoryJobs.findIndex(j => j.id === id);
    if (index !== -1) {
      memoryJobs[index] = {
        ...memoryJobs[index],
        ...updates,
        updatedAt: new Date(),
      };
      return memoryJobs[index];
    }
    return null;
  },

  async getScheduled(params?: { q?: string; sender?: string; status?: string }): Promise<{ emails: EmailJobEntity[]; total: number }> {
    const hasDb = await checkPrisma();
    if (hasDb) {
      try {
        const where: any = {
          status: { in: [JobStatus.SCHEDULED, JobStatus.DELAYED, JobStatus.PROCESSING] },
        };
        if (params?.sender && params.sender !== 'all') where.senderEmail = params.sender;
        if (params?.status && params.status !== 'all') where.status = params.status;
        if (params?.q) {
          where.OR = [
            { recipient: { contains: params.q, mode: 'insensitive' } },
            { subject: { contains: params.q, mode: 'insensitive' } },
          ];
        }

        const [emails, total] = await Promise.all([
          prisma.emailJob.findMany({ where, orderBy: { scheduledTime: 'asc' } }),
          prisma.emailJob.count({ where }),
        ]);
        return { emails: emails as unknown as EmailJobEntity[], total };
      } catch {
        // Fallback
      }
    }

    let list = memoryJobs.filter(j => j.status === JobStatus.SCHEDULED || j.status === JobStatus.DELAYED || j.status === JobStatus.PROCESSING);
    if (params?.sender && params.sender !== 'all') list = list.filter(j => j.senderEmail === params.sender);
    if (params?.status && params.status !== 'all') list = list.filter(j => j.status === params.status);
    if (params?.q) {
      const q = params.q.toLowerCase();
      list = list.filter(j => j.recipient.toLowerCase().includes(q) || j.subject.toLowerCase().includes(q));
    }
    return { emails: list, total: list.length };
  },

  async getSent(params?: { q?: string; sender?: string; status?: string }): Promise<{ emails: EmailJobEntity[]; total: number }> {
    const hasDb = await checkPrisma();
    if (hasDb) {
      try {
        const where: any = {
          status: { in: [JobStatus.SENT, JobStatus.FAILED] },
        };
        if (params?.sender && params.sender !== 'all') where.senderEmail = params.sender;
        if (params?.status && params.status !== 'all') where.status = params.status;
        if (params?.q) {
          where.OR = [
            { recipient: { contains: params.q, mode: 'insensitive' } },
            { subject: { contains: params.q, mode: 'insensitive' } },
          ];
        }

        const [emails, total] = await Promise.all([
          prisma.emailJob.findMany({ where, orderBy: { sentTime: 'desc' } }),
          prisma.emailJob.count({ where }),
        ]);
        return { emails: emails as unknown as EmailJobEntity[], total };
      } catch {
        // Fallback
      }
    }

    let list = memoryJobs.filter(j => j.status === JobStatus.SENT || j.status === JobStatus.FAILED);
    if (params?.sender && params.sender !== 'all') list = list.filter(j => j.senderEmail === params.sender);
    if (params?.status && params.status !== 'all') list = list.filter(j => j.status === params.status);
    if (params?.q) {
      const q = params.q.toLowerCase();
      list = list.filter(j => j.recipient.toLowerCase().includes(q) || j.subject.toLowerCase().includes(q));
    }
    return { emails: list, total: list.length };
  },

  async getCounts(): Promise<{ waiting: number; active: number; delayed: number; completed: number; failed: number }> {
    const hasDb = await checkPrisma();
    if (hasDb) {
      try {
        const [waiting, delayed, completed, failed] = await Promise.all([
          prisma.emailJob.count({ where: { status: JobStatus.SCHEDULED } }),
          prisma.emailJob.count({ where: { status: JobStatus.DELAYED } }),
          prisma.emailJob.count({ where: { status: JobStatus.SENT } }),
          prisma.emailJob.count({ where: { status: JobStatus.FAILED } }),
        ]);
        return { waiting, active: 0, delayed, completed, failed };
      } catch {
        // Fallback
      }
    }

    return {
      waiting: memoryJobs.filter(j => j.status === JobStatus.SCHEDULED).length,
      active: 0,
      delayed: memoryJobs.filter(j => j.status === JobStatus.DELAYED).length,
      completed: memoryJobs.filter(j => j.status === JobStatus.SENT).length,
      failed: memoryJobs.filter(j => j.status === JobStatus.FAILED).length,
    };
  },
};
