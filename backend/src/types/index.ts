import { JobStatus } from '@prisma/client';

export interface EmailAttachment {
  filename: string;
  content: string; // base64 string
  contentType?: string;
  size?: number;
  formattedSize?: string;
  dataUrl?: string;
}

export interface ScheduleRequestBody {
  sender: string;
  recipients: string[];
  subject: string;
  body: string;
  startTime?: string;
  delayBetweenEmails?: number;
  hourlyLimit?: number;
  userId?: string;
  attachments?: EmailAttachment[];
}

export interface EmailJobData {
  jobDbId: string;
  senderEmail: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledTime: string;
  scheduledAtISO: string;
  scheduledAtUTC: string;
  scheduledTimestamp: number;
  scheduledDateFormatted: string;
  createdAtISO: string;
  delaySeconds: number;
  delayMs: number;
  hourlyLimit: number;
  hourWindow: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailOptions {
  from: string;
  to: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
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
  attachments?: EmailAttachment[];
}

export interface QueueMetricsResponse {
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
}
