import { PrismaClient, JobStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for ReachInbox Scheduler...');

  // 1. Seed Verified Senders
  const senders = [
    { email: 'outreach@reachinbox.ai', name: 'Alex Carter (ReachInbox AI)', hourlyLimit: 50 },
    { email: 'growth@outboxlabs.com', name: 'Sarah Mitchell (Outbox Labs)', hourlyLimit: 60 },
    { email: 'partnerships@reachinbox.io', name: 'David Vance (Partnerships)', hourlyLimit: 40 },
    { email: 'alex.carter@reachinbox-team.com', name: 'Alex Carter (Direct)', hourlyLimit: 50 },
  ];

  for (const s of senders) {
    await prisma.sender.upsert({
      where: { email: s.email },
      update: { name: s.name, hourlyLimit: s.hourlyLimit },
      create: s,
    });
  }
  console.log(`✅ Seeded ${senders.length} verified senders.`);

  // 2. Seed Default Google OAuth User
  const defaultUser = await prisma.user.upsert({
    where: { email: 'alex.carter@reachinbox.ai' },
    update: {},
    create: {
      name: 'Alex Carter',
      email: 'alex.carter@reachinbox.ai',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      googleId: 'google_oauth_1092',
    },
  });
  console.log(`✅ Seeded default authenticated user: ${defaultUser.email}`);

  // 3. Seed Slack Integration
  await prisma.slackIntegration.upsert({
    where: { id: 'default_slack_integration' },
    update: {},
    create: {
      id: 'default_slack_integration',
      userId: defaultUser.id,
      channelName: '#reachinbox-scheduler-alerts',
      teamName: 'Outbox Labs Team',
      webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
      notifyOnRateLimit: true,
    },
  });
  console.log(`✅ Seeded default Slack integration.`);

  // 4. Seed Initial Email Jobs (Scheduled + Sent)
  const sampleJobs = [
    {
      recipient: 'elena.rostova@techscale.co',
      recipientName: 'Elena Rostova',
      subject: 'Scaling cold outreach with AI workflows for TechScale',
      body: 'Hi Elena,\n\nSaw TechScale is expanding its outbound sales team. ReachInbox automates verified lead enrichment.\n\nBest,\nAlex',
      senderEmail: 'outreach@reachinbox.ai',
      scheduledTime: new Date(Date.now() + 15 * 60 * 1000),
      status: JobStatus.SCHEDULED,
      delaySeconds: 3,
      hourlyLimit: 50,
      hourWindow: '2026-11-24T01',
      userId: defaultUser.id,
    },
    {
      recipient: 'ceo@datacraft.ai',
      recipientName: 'Jonathan Hayes',
      subject: 'ReachInbox AI cold outreach benchmark report',
      body: 'Hi Jonathan,\n\nWe prepared a custom lead conversion benchmark for DataCraft.\n\nWarm regards,\nAlex',
      senderEmail: 'outreach@reachinbox.ai',
      scheduledTime: new Date(Date.now() - 120 * 60 * 1000),
      sentTime: new Date(Date.now() - 118 * 60 * 1000),
      status: JobStatus.SENT,
      delaySeconds: 2,
      hourlyLimit: 50,
      etherealUrl: 'https://ethereal.email/message/WaQKMgKddxQDoWBcWaQKMgKddxQDoWBd',
      messageId: '<dc8319-ethereal-9104@reachinbox.ai>',
      userId: defaultUser.id,
    },
  ];

  for (const job of sampleJobs) {
    await prisma.emailJob.create({
      data: job,
    });
  }
  console.log(`✅ Seeded sample scheduled and sent email jobs.`);
  console.log('✨ Database seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
