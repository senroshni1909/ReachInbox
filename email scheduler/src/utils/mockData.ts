import type { EmailJob, QueueMetrics, SlackConfig } from '../types';

export const AVAILABLE_SENDERS = [
  'oliver.brown@domain.io',
  'outreach@reachinbox.ai',
  'growth@outboxlabs.com',
  'partnerships@reachinbox.io',
];

export const INITIAL_SCHEDULED_EMAILS: EmailJob[] = [];

export const INITIAL_SENT_EMAILS: EmailJob[] = [];

export const INITIAL_QUEUE_METRICS: QueueMetrics = {
  waiting: 0,
  active: 0,
  delayed: 0,
  completed: 0,
  failed: 0,
  paused: false,
  totalProcessed: 0,
  currentThroughput: 0,
};

export const INITIAL_SLACK_CONFIG: SlackConfig = {
  connected: true,
  channelName: '#reachinbox-scheduler-alerts',
  teamName: 'Outbox Labs Team',
  webhookUrl: '',
  notifyOnRateLimit: true,
  lastNotifiedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
};
