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

export async function checkRateLimitAndAlert(senderEmail: string, hourWindow: string, limit: number): Promise<void> {
  try {
    const tracker = await prisma.hourlyRateLimitTracker.findUnique({
      where: {
        senderEmail_hourWindow: {
          senderEmail,
          hourWindow,
        },
      },
    });

    if (tracker && tracker.sentCount >= limit && !tracker.alertSent) {
      await sendSlackAlert(
        `⚠️ *Hourly Rate Limit Reached* for sender \`${senderEmail}\`.\n` +
        `Current Window: \`${hourWindow}\`\n` +
        `Emails sent: *${tracker.sentCount} / ${limit}*\n` +
        `Subsequent jobs for this sender will automatically be delayed into the next hour window.`
      );

      await prisma.hourlyRateLimitTracker.update({
        where: { id: tracker.id },
        data: { alertSent: true },
      });
    }
  } catch {
    // Graceful error handling
  }
}
