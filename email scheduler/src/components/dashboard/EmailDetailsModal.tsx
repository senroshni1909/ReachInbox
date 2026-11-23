import React from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import type { EmailJob } from '../../types';
import { formatDateTime } from '../../utils/dateFormatter';
import { ExternalLink, AlertCircle, Copy, Check } from 'lucide-react';
import { Button } from '../common/Button';

interface EmailDetailsModalProps {
  email: EmailJob | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmailDetailsModal: React.FC<EmailDetailsModalProps> = ({
  email,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!email) return null;

  const handleCopyBody = () => {
    navigator.clipboard.writeText(email.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Email Job Inspector"
      description={`Job ID: ${email.id}`}
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Header Status & Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
              Current Job Status
            </span>
            <div className="mt-1 flex items-center gap-2">
              <Badge status={email.status} />
              {email.hourWindow && (
                <span className="text-[11px] text-slate-400 font-mono">
                  Window: {email.hourWindow}
                </span>
              )}
            </div>
          </div>

          {email.etherealUrl && (
            <a
              href={email.etherealUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all"
            >
              <span>Open in Ethereal Mail</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Sender & Recipient Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              From (Sender)
            </span>
            <p className="font-mono text-slate-200 mt-1 break-all">{email.sender}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              To (Recipient)
            </span>
            <p className="font-mono text-slate-200 mt-1 break-all">{email.recipient}</p>
          </div>
        </div>

        {/* Timestamps & Pacing Configuration */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Scheduled For
            </span>
            <p className="text-slate-200 font-medium mt-1">
              {formatDateTime(email.scheduledTime)}
            </p>
          </div>

          {email.sentTime && (
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Delivered At
              </span>
              <p className="text-slate-200 font-medium mt-1">
                {formatDateTime(email.sentTime)}
              </p>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Throttling Rule
            </span>
            <p className="text-slate-200 font-mono mt-1">
              Delay: {email.delaySeconds}s | Cap: {email.hourlyLimit}/hr
            </p>
          </div>
        </div>

        {/* Subject & Body */}
        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Subject
            </span>
            <p className="text-slate-100 font-semibold text-sm mt-1">{email.subject}</p>
          </div>

          <div className="relative p-4 rounded-xl bg-[#0d0e14] border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Email Content
              </span>
              <button
                type="button"
                onClick={handleCopyBody}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
              {email.body}
            </pre>
          </div>
        </div>

        {/* Error message if failed */}
        {email.errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Delivery Error</p>
              <p className="text-[11px] text-rose-200/90 mt-0.5 font-mono leading-relaxed">
                {email.errorMessage}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose} size="sm">
            Close Inspector
          </Button>
        </div>
      </div>
    </Modal>
  );
};
