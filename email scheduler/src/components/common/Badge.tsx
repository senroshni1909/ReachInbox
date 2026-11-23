import React from 'react';
import type { EmailStatus } from '../../types';

interface BadgeProps {
  status?: EmailStatus | string;
  variant?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate' | 'sky';
  children?: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  children,
  className = '',
  dot = true,
}) => {
  let chosenVariant = variant || 'slate';

  if (status) {
    switch (status) {
      case 'sent':
      case 'completed':
        chosenVariant = 'emerald';
        break;
      case 'scheduled':
      case 'active':
        chosenVariant = 'indigo';
        break;
      case 'delayed':
      case 'waiting':
        chosenVariant = 'amber';
        break;
      case 'failed':
      case 'cancelled':
        chosenVariant = 'rose';
        break;
      case 'processing':
        chosenVariant = 'sky';
        break;
      default:
        chosenVariant = 'slate';
    }
  }

  const styles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const dotColors = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    indigo: 'bg-indigo-400 animate-pulse',
    sky: 'bg-sky-400 animate-pulse',
    slate: 'bg-slate-400',
  };

  const label = children || (status ? status.charAt(0).toUpperCase() + status.slice(1) : '');

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[chosenVariant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[chosenVariant]}`} />}
      {label}
    </span>
  );
};
