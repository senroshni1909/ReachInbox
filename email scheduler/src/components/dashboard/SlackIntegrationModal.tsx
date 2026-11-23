import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import type { SlackConfig } from '../../types';
import { slackApi } from '../../api/slackApi';
import { useToast } from '../../context/ToastContext';
import { Hash, BellRing, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SlackIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SlackConfig;
  onConfigUpdated: (newConfig: SlackConfig) => void;
}

export const SlackIntegrationModal: React.FC<SlackIntegrationModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
}) => {
  const { showToast } = useToast();
  const [channel, setChannel] = useState(config.channelName || '#reachinbox-alerts');
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || '');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await slackApi.updateConfig({
        channelName: channel,
        webhookUrl: webhookUrl.trim() || undefined,
        connected: !!(channel && (webhookUrl || config.connected)),
      });
      if (res.success) {
        onConfigUpdated(res.config);
        showToast({
          type: 'success',
          title: 'Slack settings updated',
          message: `Connected to ${res.config.channelName}. Rate-limit notifications enabled.`,
        });
        onClose();
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Could not save Slack config',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestAlert = async () => {
    setIsTesting(true);
    try {
      const res = await slackApi.sendRateLimitAlert('outreach@reachinbox.ai', 50);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Live Slack Alert Triggered!',
          message: res.message,
          duration: 6000,
        });
      } else {
        showToast({
          type: 'warning',
          title: 'Slack Alert Pending',
          message: res.message,
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Error sending alert',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsSaving(true);
    try {
      const res = await slackApi.updateConfig({
        connected: false,
        channelName: '',
        webhookUrl: '',
      });
      if (res.success) {
        onConfigUpdated(res.config);
        showToast({
          type: 'info',
          title: 'Slack Disconnected',
          message: 'Rate-limit alerts to Slack will be silenced without failing email jobs.',
        });
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Slack Rate-Limit Integration"
      description="Connect your workspace to receive real-time notifications when a sender hits their hourly limit."
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Connection status banner */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            config.connected
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-300'
          }`}
        >
          <div className="p-2 rounded-lg bg-black/40">
            <Hash className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-white flex items-center gap-1.5">
              <span>{config.connected ? 'Slack is Connected' : 'Slack Not Connected'}</span>
              {config.connected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />}
            </p>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              {config.connected
                ? `Alerts are automatically pushed to ${config.channelName} the moment a sender's hourly limit is reached.`
                : 'Connect via Slack OAuth or enter an Incoming Webhook URL to enable live alerts.'}
            </p>
          </div>
        </div>

        {/* Configuration inputs */}
        <div className="space-y-3">
          <Input
            label="Alert Channel"
            placeholder="#reachinbox-scheduler-alerts"
            value={channel}
            onChange={e => setChannel(e.target.value)}
          />

          <Input
            label="Slack Incoming Webhook URL (Optional / Direct)"
            placeholder="Enter incoming webhook URL"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            helperText="Leave empty to use OAuth default webhook"
          />
        </div>

        {/* Live Test Alert Trigger */}
        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Verify Live Notification</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Dispatches a rate-limit breach payload to test your webhook
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestAlert}
            isLoading={isTesting}
            leftIcon={<BellRing className="w-3.5 h-3.5 text-amber-400" />}
          >
            Trigger Test
          </Button>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          {config.connected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
            >
              Disconnect Slack
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={isSaving} size="sm">
              Save Integration
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
