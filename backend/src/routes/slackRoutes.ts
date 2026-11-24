import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { ENV } from '../config/env.js';

export const slackRouter = Router();

// GET /api/slack/status
slackRouter.get('/status', async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await prisma.slackIntegration.findFirst();
    const hasWebhook = !!(config?.webhookUrl || ENV.SLACK_WEBHOOK_URL);

    res.json({
      config: {
        connected: hasWebhook,
        webhookUrl: config?.webhookUrl || (ENV.SLACK_WEBHOOK_URL ? 'https://hooks.slack.com/services/***' : ''),
        channelName: config?.channelName || '#reachinbox-scheduler-alerts',
        teamName: config?.teamName || 'ReachInbox Workspace',
        notifyOnRateLimit: config?.notifyOnRateLimit ?? true,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch Slack status' });
  }
});

// POST /api/slack/configure
slackRouter.post('/configure', async (req: Request, res: Response): Promise<void> => {
  try {
    const { webhookUrl, channelName, teamName, notifyOnRateLimit } = req.body;

    const existing = await prisma.slackIntegration.findFirst();
    let updated;

    if (existing) {
      updated = await prisma.slackIntegration.update({
        where: { id: existing.id },
        data: {
          webhookUrl,
          channelName: channelName || existing.channelName,
          teamName: teamName || existing.teamName,
          notifyOnRateLimit: notifyOnRateLimit ?? existing.notifyOnRateLimit,
        },
      });
    } else {
      updated = await prisma.slackIntegration.create({
        data: {
          webhookUrl,
          channelName: channelName || '#reachinbox-scheduler-alerts',
          teamName: teamName || 'ReachInbox Workspace',
          notifyOnRateLimit: notifyOnRateLimit ?? true,
        },
      });
    }

    res.json({
      success: true,
      config: {
        connected: !!updated.webhookUrl,
        webhookUrl: updated.webhookUrl ? 'https://hooks.slack.com/services/***' : '',
        channelName: updated.channelName,
        teamName: updated.teamName,
        notifyOnRateLimit: updated.notifyOnRateLimit,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update Slack configuration' });
  }
});
