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
  console.log('✨ Database seeding finished successfully (0 mock emails seeded).');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
