import React from 'react';
import { Clock, ShieldAlert, Cpu } from 'lucide-react';
import { formatDateTime } from '../../utils/dateFormatter';

interface SchedulePreviewProps {
  totalLeads: number;
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
  sender: string;
}

export const SchedulePreview: React.FC<SchedulePreviewProps> = ({
  totalLeads,
  startTime,
  delaySeconds,
  hourlyLimit,
  sender,
}) => {
  if (totalLeads <= 0) return null;

  const startDate = new Date(startTime);
  const startMs = startDate.getTime();

  // Calculate total hour windows needed
  const totalHoursNeeded = Math.ceil(totalLeads / hourlyLimit);

  // Calculate approximate completion timestamp
  // Last lead index: totalLeads - 1
  const lastIndex = totalLeads - 1;
  const lastHourWindow = Math.floor(lastIndex / hourlyLimit);
  const positionInLastHour = lastIndex % hourlyLimit;
  const finishMs =
    startMs +
    lastHourWindow * 3600 * 1000 +
    positionInLastHour * (delaySeconds * 1000);
  const finishDate = new Date(finishMs);

  return (
    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
      <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5 text-indigo-400">
          <Cpu className="w-4 h-4" />
          <span>BullMQ Schedule Projection</span>
        </div>
        <span className="text-slate-400 font-mono text-[11px]">
          {totalLeads} job{totalLeads > 1 ? 's' : ''} queued
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-slate-300">
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
            Start Time
          </span>
          <span className="font-medium text-slate-200">{formatDateTime(startTime)}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
            Estimated Finish
          </span>
          <span className="font-medium text-slate-200">
            {formatDateTime(finishDate.toISOString())}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          Pacing: 1 email every {delaySeconds}s
        </span>
        <span className="flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          Sender Cap: {hourlyLimit}/hour for {sender}
        </span>
      </div>

      {totalHoursNeeded > 1 && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
          ⚠️ Since total recipients ({totalLeads}) exceed the hourly rate limit ({hourlyLimit}/hr), jobs will automatically roll over into {totalHoursNeeded} consecutive 1-hour windows without dropping!
        </div>
      )}
    </div>
  );
};
