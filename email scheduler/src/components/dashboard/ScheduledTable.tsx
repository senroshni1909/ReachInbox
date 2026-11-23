import React from 'react';
import type { EmailJob } from '../../types';
import { Badge } from '../common/Badge';
import { TableSkeleton } from '../common/Skeleton';
import { formatDateTime, formatRelativeTime } from '../../utils/dateFormatter';
import { Clock, Calendar, Trash2, Eye, Plus } from 'lucide-react';
import { Button } from '../common/Button';

interface ScheduledTableProps {
  emails: EmailJob[];
  isLoading: boolean;
  onCancelJob: (id: string) => void;
  onViewDetails: (email: EmailJob) => void;
  onOpenCompose: () => void;
}

export const ScheduledTable: React.FC<ScheduledTableProps> = ({
  emails,
  isLoading,
  onCancelJob,
  onViewDetails,
  onOpenCompose,
}) => {
  if (isLoading) {
    return (
      <div className="bg-[#12141d] border border-slate-800/80 rounded-2xl overflow-hidden">
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-[#12141d] border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
          <Clock className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white">No scheduled emails found</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          No jobs are currently queued in BullMQ matching your filters. Schedule a new outbound sequence using CSV or text leads.
        </p>
        <Button
          onClick={onOpenCompose}
          leftIcon={<Plus className="w-4 h-4" />}
          className="mt-5"
          size="sm"
        >
          Schedule New Email
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-[#12141d] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-4">Recipient</th>
              <th className="py-3.5 px-4">Subject</th>
              <th className="py-3.5 px-4">Sender</th>
              <th className="py-3.5 px-4">Scheduled Time</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-slate-300">
            {emails.map(email => (
              <tr
                key={email.id}
                className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                onClick={() => onViewDetails(email)}
              >
                {/* Recipient */}
                <td className="py-3.5 px-4 font-medium text-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {email.recipient.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">{email.recipientName || email.recipient.split('@')[0]}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{email.recipient}</p>
                    </div>
                  </div>
                </td>

                {/* Subject */}
                <td className="py-3.5 px-4 max-w-xs truncate">
                  <p className="font-medium text-slate-200 truncate">{email.subject}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{email.body}</p>
                </td>

                {/* Sender */}
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                  {email.sender}
                </td>

                {/* Scheduled Time */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{formatDateTime(email.scheduledTime)}</span>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-medium block mt-0.5">
                    {formatRelativeTime(email.scheduledTime)}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <Badge status={email.status} />
                  {email.status === 'delayed' && (
                    <span className="block text-[10px] text-amber-400 font-medium mt-1">
                      Rate limit rollover
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onViewDetails(email)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onCancelJob(email.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Cancel Scheduled Job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
