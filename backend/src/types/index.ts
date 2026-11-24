import { JobStatus } from '@prisma/client';

export interface ScheduleRequestBody {
  sender: string;
  recipients: string[];
  subject: string;
  body: string;
  startTime?: string;
  delayBetweenEmails?: number;
  hourlyLimit?: number;
  userId?: string;
}

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

export interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId: string;
  etherealUrl?: string;
  error?: string;
}

export interface FormattedEmailJob {
  id: string;
  recipient: string;
  recipientName?: string;
  subject: string;
  body: string;
  sender: string;
  scheduledTime: string;
  sentTime?: string;
  status: string;
  delaySeconds: number;
  delayBetweenEmails: number;
  hourlyLimit: number;
  etherealUrl?: string;
  createdAt: string;
}

export interface QueueMetricsResponse {
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
}
