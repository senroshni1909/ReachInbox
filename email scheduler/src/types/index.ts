export type EmailStatus = 'scheduled' | 'delayed' | 'processing' | 'sent' | 'failed' | 'cancelled';

export interface EmailJob {
  id: string;
  recipient: string;
  recipientName?: string;
  subject: string;
  body: string;
  sender: string;
  scheduledTime: string; // ISO string
  sentTime?: string; // ISO string
  status: EmailStatus;
  delaySeconds: number;
  delayBetweenEmails?: number;
  hourlyLimit: number;
  attempts?: number;
  errorMessage?: string;
  etherealUrl?: string;
  messageId?: string;
  createdAt: string;
  hourWindow?: string;
  tags?: string[];
}

export interface SchedulePayload {
  recipients: string[];
  sender: string;
  subject: string;
  body: string;
  startTime: string; // ISO string
  delayBetweenEmails: number; // in seconds
  hourlyLimit: number;
}

// Export class User so it satisfies both type and runtime export in ES modules
export class User {
  id: string = '';
  name: string = '';
  email: string = '';
  avatar: string = '';
  provider: 'google' | 'demo' = 'demo';
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
  paused: boolean;
  totalProcessed: number;
  currentThroughput: number; // emails/min
}

export interface SlackConfig {
  connected: boolean;
  channelName?: string;
  teamName?: string;
  webhookUrl?: string;
  notifyOnRateLimit: boolean;
  lastNotifiedAt?: string;
}

export interface FilterOptions {
  search?: string;
  sender?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  isMockFallback?: boolean;
}
