import type { EmailJob, QueueMetrics, SlackConfig } from '../types';

export const AVAILABLE_SENDERS = [
  'oliver.brown@domain.io',
  'outreach@reachinbox.ai',
  'growth@outboxlabs.com',
  'partnerships@reachinbox.io',
];

export const INITIAL_SCHEDULED_EMAILS: EmailJob[] = [
  {
    id: 'job_sched_01',
    recipient: 'john.smith@acme.com',
    recipientName: 'John Smith',
    subject: 'Meeting follow-up - Scheduled',
    body: 'Hi John, just wanted to follow up on our meeting and discuss the next milestones for the outbound campaign.',
    sender: 'oliver.brown@domain.io',
    scheduledTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    status: 'scheduled',
    hourlyLimit: 50,
    delaySeconds: 3,
    delayBetweenEmails: 3,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    hourWindow: '2026-11-24T00',
    tags: ['Scheduled', 'Meeting Follow-up']
  },
  {
    id: 'job_sched_02',
    recipient: 'olive@designcraft.io',
    recipientName: 'Olive',
    subject: "Ramit, great to meet you - you'll love it",
    body: 'Hi Olive, just wanted to follow up on our meeting and send over the platform demo walkthrough.',
    sender: 'oliver.brown@domain.io',
    scheduledTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    status: 'scheduled',
    hourlyLimit: 60,
    delaySeconds: 4,
    delayBetweenEmails: 4,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    hourWindow: '2026-11-24T01',
    tags: ['Scheduled', 'Outreach']
  },
  {
    id: 'job_sched_03',
    recipient: 'elena.rostova@techscale.co',
    recipientName: 'Elena Rostova',
    subject: 'Scaling cold outreach with AI workflows for TechScale',
    body: 'Hi Elena,\n\nSaw TechScale is expanding its outbound sales team. ReachInbox automates verified lead enrichment.\n\nBest,\nOliver',
    sender: 'oliver.brown@domain.io',
    scheduledTime: new Date(Date.now() + 110 * 60 * 1000).toISOString(),
    status: 'delayed',
    hourlyLimit: 40,
    delaySeconds: 2,
    delayBetweenEmails: 2,
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    hourWindow: '2026-11-24T02',
    tags: ['Delayed: Hourly Limit Reached']
  },
  {
    id: 'job_sched_04',
    recipient: 'arthur.pendelton@apexventures.com',
    recipientName: 'Arthur Pendelton',
    subject: 'AI-driven lead sequencing platform introduction',
    body: 'Arthur, wanted to put ReachInbox on your radar following your syndicate announcement in enterprise B2B sales automation.',
    sender: 'oliver.brown@domain.io',
    scheduledTime: new Date(Date.now() + 180 * 60 * 1000).toISOString(),
    status: 'scheduled',
    hourlyLimit: 50,
    delaySeconds: 5,
    delayBetweenEmails: 5,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    hourWindow: '2026-11-24T03',
    tags: ['Investor', 'B2B']
  }
];

export const INITIAL_SENT_EMAILS: EmailJob[] = [
  {
    id: 'job_sent_01',
    recipient: 'ceo@datacraft.ai',
    recipientName: 'Jonathan Hayes',
    subject: 'ReachInbox AI cold outreach benchmark report',
    body: 'Hi Jonathan,\n\nWe prepared a custom lead conversion benchmark for DataCraft. We noticed you are currently using traditional email blasts.\n\nOur BullMQ multi-sender scheduler keeps inbox placement above 96%.\n\nWarm regards,\nOliver',
    sender: 'oliver.brown@domain.io',
    scheduledTime: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    sentTime: new Date(Date.now() - 118 * 60 * 1000).toISOString(),
    status: 'sent',
    delaySeconds: 2,
    hourlyLimit: 100,
    etherealUrl: 'https://ethereal.email/message/WaQKMgKddxQDoWBcWaQKMgKddxQDoWBd',
    messageId: '<dc8319-ethereal-9104@domain.io>',
    createdAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    tags: ['Delivered', 'Ethereal SMTP']
  },
  {
    id: 'job_sent_02',
    recipient: 'charlie.wu@cloudnexus.org',
    recipientName: 'Charlie Wu',
    subject: 'Transforming outbound sales with Outbox Labs',
    body: 'Hello Charlie,\n\nSending you a quick preview of how CloudNexus can trigger personalized multi-step emails on demand.\n\nTake care,\nOliver',
    sender: 'oliver.brown@domain.io',
    scheduledTime: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    sentTime: new Date(Date.now() - 74 * 60 * 1000).toISOString(),
    status: 'sent',
    delaySeconds: 3,
    hourlyLimit: 50,
    etherealUrl: 'https://ethereal.email/message/ZaOKMgKddxQDoWBcZaOKMgKddxQDoWBe',
    messageId: '<89af10-ethereal-7712@domain.io>',
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    tags: ['Delivered', 'Ethereal SMTP']
  },
  {
    id: 'job_sent_03',
    recipient: 'invalid-address@bouncetest.invalid',
    subject: 'Test delivery for SMTP bounce simulator',
    body: 'This email tested recipient server bounce simulation.',
    sender: 'oliver.brown@domain.io',
    scheduledTime: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    sentTime: new Date(Date.now() - 39 * 60 * 1000).toISOString(),
    status: 'failed',
    delaySeconds: 2,
    hourlyLimit: 50,
    errorMessage: 'SMTP 550 5.1.1: Recipient address rejected: User unknown in virtual mailbox table',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    tags: ['Failed: Recipient Unknown']
  }
];

export const INITIAL_QUEUE_METRICS: QueueMetrics = {
  waiting: 3,
  active: 0,
  delayed: 1,
  completed: 842,
  failed: 3,
  paused: false,
  totalProcessed: 845,
  currentThroughput: 18,
};

export const INITIAL_SLACK_CONFIG: SlackConfig = {
  connected: true,
  channelName: '#reachinbox-scheduler-alerts',
  teamName: 'Outbox Labs Team',
  webhookUrl: '',
  notifyOnRateLimit: true,
  lastNotifiedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
};
