import { apiRequest } from './client';
import type { SlackConfig } from '../types';
import { INITIAL_SLACK_CONFIG } from '../utils/mockData';

const SLACK_CONFIG_KEY = 'reachinbox_slack_config_v1';

export const slackApi = {
  async getStatus(): Promise<{ config: SlackConfig; isLive: boolean }> {
    const live = await apiRequest<{ config: SlackConfig }>('/slack/status');
    if (live.isLive && live.data?.config) {
      return { config: live.data.config, isLive: true };
    }

    const stored = localStorage.getItem(SLACK_CONFIG_KEY);
    if (stored) {
      try {
        return { config: JSON.parse(stored), isLive: false };
      } catch {
        // use default
      }
    }
    return { config: INITIAL_SLACK_CONFIG, isLive: false };
  },

  async updateConfig(config: Partial<SlackConfig>): Promise<{ success: boolean; config: SlackConfig; isLive: boolean }> {
    const live = await apiRequest<{ success: boolean; config: SlackConfig }>('/slack/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
    if (live.isLive && live.data?.config) {
      return { success: true, config: live.data.config, isLive: true };
    }

    const current = (await this.getStatus()).config;
    const updated: SlackConfig = {
      ...current,
      ...config,
      connected: !!(config.webhookUrl || config.channelName),
    };
    localStorage.setItem(SLACK_CONFIG_KEY, JSON.stringify(updated));
    return { success: true, config: updated, isLive: false };
  },

  async sendRateLimitAlert(sender: string, hourlyLimit: number): Promise<{ success: boolean; message: string; isLive: boolean }> {
    const live = await apiRequest<{ success: boolean; message: string }>('/slack/test-alert', {
      method: 'POST',
      body: JSON.stringify({ sender, hourlyLimit }),
    });
    if (live.isLive && live.data) {
      return { ...live.data, isLive: true };
    }

    const { config } = await this.getStatus();
    if (!config.connected) {
      return {
        success: false,
        message: 'Slack is not connected. Connect Slack or add a webhook to receive rate limit alerts.',
        isLive: false,
      };
    }

    // Update last notified time
    config.lastNotifiedAt = new Date().toISOString();
    localStorage.setItem(SLACK_CONFIG_KEY, JSON.stringify(config));

    return {
      success: true,
      message: `🔔 Rate Limit Alert delivered to ${config.channelName || '#reachinbox-alerts'}: Sender "${sender}" exceeded hourly limit (${hourlyLimit}/hr). Remaining jobs delayed into next hour window.`,
      isLive: false,
    };
  },
};
