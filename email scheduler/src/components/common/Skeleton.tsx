import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full divide-y divide-slate-800/60 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 gap-4">
          <div className="flex items-center gap-3 w-1/4">
            <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0" />
            <div className="space-y-1.5 w-full">
              <div className="h-3.5 bg-slate-800 rounded w-3/4" />
              <div className="h-2.5 bg-slate-800/60 rounded w-1/2" />
            </div>
          </div>
          <div className="w-1/3">
            <div className="h-3.5 bg-slate-800 rounded w-4/5" />
          </div>
          <div className="w-1/6">
            <div className="h-3 bg-slate-800 rounded w-2/3" />
          </div>
          <div className="w-20">
            <div className="h-5 bg-slate-800 rounded-full w-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#12141d] border border-slate-800/80 rounded-2xl p-5 animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-3 bg-slate-800 rounded w-24" />
        <div className="w-8 h-8 rounded-lg bg-slate-800" />
      </div>
      <div className="h-7 bg-slate-800 rounded w-16" />
      <div className="h-2 bg-slate-800/60 rounded w-32" />
    </div>
  );
};
