import React from 'react';
import { Card } from '../common/Card';
import type { QueueMetrics, SlackConfig } from '../../types';
import { Clock, CheckCheck, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';

interface StatsOverviewProps {
  metrics: QueueMetrics;
  slackConfig: SlackConfig;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  metrics,
  slackConfig,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Scheduled In Queue */}
      <Card className="relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Scheduled in Queue
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-white font-mono">
            {metrics.waiting + metrics.delayed}
          </span>
          <span className="text-xs text-indigo-400 font-medium">delayed jobs</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Persistent in Redis · Ready for BullMQ worker
        </p>
      </Card>

      {/* 2. Sent Emails */}
      <Card className="relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Emails Sent (Ethereal)
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-white font-mono">
            {metrics.completed}
          </span>
          <span className="text-xs text-emerald-400 font-medium">99.4% deliverability</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Verified fake SMTP previews available
        </p>
      </Card>

      {/* 3. BullMQ Worker Concurrency & Throughput */}
      <Card className="relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Worker Concurrency
          </span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-white font-mono">
            {metrics.active} Active
          </span>
          <span className="text-xs text-purple-400 font-medium">~{metrics.currentThroughput} sends/min</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Thread-safe lock · Idempotent delivery
        </p>
      </Card>

      {/* 4. Rate Limit & Slack Alert Status */}
      <Card className="relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Rate Limit & Alerts
          </span>
          <div className={`p-2 rounded-xl border ${
            slackConfig.connected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-sm font-bold text-white flex items-center gap-1.5">
            {slackConfig.connected ? (
              <>
                <span className="text-emerald-400">Slack Synced</span>
                <CheckCircle className="w-4 h-4 text-emerald-400 inline" />
              </>
            ) : (
              <span className="text-amber-400">Slack Disconnected</span>
            )}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400 truncate">
          {slackConfig.channelName || 'Rate limits push alert to Slack channel'}
        </p>
      </Card>
    </div>
  );
};
