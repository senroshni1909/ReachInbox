import { prisma } from '../lib/prisma.js';
import { ENV } from '../config/env.config.js';

export async function sendSlackAlert(message: string): Promise<boolean> {
  const webhookUrl = ENV.SLACK_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith('https://hooks.slack.com')) {
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 *ReachInbox Scheduler Alert*\n${message}`,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Slack alert notification skipped/failed:', err);
    return false;
  }
}

export async function recordSendAndCheckRateLimit(
  senderEmail: string,
  hourWindow: string,
  limit: number
): Promise<{ exceeded: boolean; currentCount: number }> {
  try {
    const tracker = await prisma.hourlyRateLimitTracker.upsert({
      where: {
        senderEmail_hourWindow: {
          senderEmail,
          hourWindow,
        },
      },
      update: {
        sentCount: { increment: 1 },
      },
      create: {
        senderEmail,
        hourWindow,
        sentCount: 1,
        limit,
      },
    });

    const isExceeded = tracker.sentCount > limit;

    if (isExceeded && !tracker.alertSent) {
      await sendSlackAlert(
        `⚠️ *Hourly Rate Limit Reached* for sender \`${senderEmail}\`.\n` +
        `Current Window: \`${hourWindow}\`\n` +
        `Emails sent: *${tracker.sentCount} / ${limit}*\n` +
        `Parallel worker detected sender reached limit; subsequent jobs will be delayed into next hour window.`
      );

      await prisma.hourlyRateLimitTracker.update({
        where: { id: tracker.id },
        data: { alertSent: true },
      });
    }

    return { exceeded: isExceeded, currentCount: tracker.sentCount };
  } catch (err: any) {
    console.warn('Rate limit tracker warning:', err.message);
    return { exceeded: false, currentCount: 0 };
  }
}

export async function checkRateLimitAndAlert(senderEmail: string, hourWindow: string, limit: number): Promise<void> {
  await recordSendAndCheckRateLimit(senderEmail, hourWindow, limit);
}
