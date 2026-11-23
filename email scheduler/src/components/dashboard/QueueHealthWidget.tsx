import React from 'react';
import type { QueueMetrics } from '../../types';
import { Activity, ExternalLink } from 'lucide-react';

interface QueueHealthWidgetProps {
  metrics: QueueMetrics;
}

export const QueueHealthWidget: React.FC<QueueHealthWidgetProps> = ({ metrics }) => {
  return (
    <div className="bg-[#12141d] border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Left: Queue Live Status */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              BullMQ Queue Engine Health
            </h4>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Survives restarts via Redis · No cron dependencies · Idempotent execution
          </p>
        </div>
      </div>

      {/* Middle: Pill badges of states */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-slate-400">Waiting:</span>
          <span className="font-mono font-bold text-slate-200">{metrics.waiting}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-slate-400">Active:</span>
          <span className="font-mono font-bold text-purple-300">{metrics.active}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-slate-400">Delayed:</span>
          <span className="font-mono font-bold text-amber-300">{metrics.delayed}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-slate-400">Completed:</span>
          <span className="font-mono font-bold text-emerald-300">{metrics.completed}</span>
        </div>
      </div>

      {/* Right: Link to BullMQ dashboard */}
      <a
        href="http://localhost:5000/admin/queues"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-semibold transition-all shrink-0 cursor-pointer"
      >
        <span>BullMQ Arena UI</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};
