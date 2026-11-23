import React from 'react';
import { Search, Plus, RotateCw } from 'lucide-react';
import { Button } from '../common/Button';
import { AVAILABLE_SENDERS } from '../../utils/mockData';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedSender: string;
  onSenderChange: (sender: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onRefresh: () => void;
  onOpenCompose: () => void;
  isRefreshing?: boolean;
  activeTab: 'scheduled' | 'sent';
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedSender,
  onSenderChange,
  selectedStatus,
  onStatusChange,
  onRefresh,
  onOpenCompose,
  isRefreshing = false,
  activeTab,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 bg-[#12141d] border border-slate-800/80 rounded-2xl">
      {/* Search Input (Elasticsearch backend simulation) */}
      <div className="flex-1 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={`Search ${activeTab === 'scheduled' ? 'scheduled' : 'sent'} emails by recipient, subject, or content...`}
          className="w-full bg-[#161822] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition-all"
        />
        {searchQuery && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-mono border border-indigo-500/20 hidden sm:inline">
            Elasticsearch query
          </span>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Sender Filter */}
        <select
          value={selectedSender}
          onChange={e => onSenderChange(e.target.value)}
          className="bg-[#161822] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">All Senders</option>
          {AVAILABLE_SENDERS.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={e => onStatusChange(e.target.value)}
          className="bg-[#161822] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          {activeTab === 'scheduled' ? (
            <>
              <option value="scheduled">Scheduled</option>
              <option value="delayed">Delayed (Hourly Cap)</option>
              <option value="processing">Processing</option>
            </>
          ) : (
            <>
              <option value="sent">Sent</option>
              <option value="failed">Failed / Bounced</option>
            </>
          )}
        </select>

        {/* Refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          isLoading={isRefreshing}
          className="p-2.5 text-slate-400 hover:text-white"
          title="Refresh Queue"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </Button>

        {/* Primary Compose New Email CTA */}
        <Button
          onClick={onOpenCompose}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-md shadow-indigo-500/30"
        >
          Compose New Email
        </Button>
      </div>
    </div>
  );
};
