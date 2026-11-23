import React from 'react';
import { UserProfileDropdown } from '../auth/UserProfileDropdown';
import type { SlackConfig } from '../../types';
import { Hash, Activity, ExternalLink, Zap } from 'lucide-react';

interface HeaderProps {
  onOpenSlack: () => void;
  onOpenLoginModal: () => void;
  slackConfig: SlackConfig;
  isLiveBackend: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSlack,
  onOpenLoginModal,
  slackConfig,
  isLiveBackend,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090a0f]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  ReachInbox<span className="text-indigo-400">.ai</span>
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Scheduler v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Persistent BullMQ + Redis Email Engine
              </p>
            </div>
          </div>

          {/* Backend Connection Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveBackend ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300 font-medium">
              {isLiveBackend ? 'Live Backend Connected' : 'Local Demo Mode'}
            </span>
          </div>
        </div>

        {/* Right Navigation & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Slack Integration Button */}
          <button
            onClick={onOpenSlack}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              slackConfig.connected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            <Hash className="w-3.5 h-3.5 text-current" />
            <span className="hidden sm:inline">
              {slackConfig.connected ? 'Slack Connected' : 'Connect Slack'}
            </span>
            {slackConfig.connected && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* BullMQ Dashboard External Link */}
          <a
            href="http://localhost:5000/admin/queues"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            title="Open Live BullMQ Arena UI"
          >
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>BullMQ Arena</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>

          {/* User Profile dropdown */}
          <UserProfileDropdown onOpenLoginModal={onOpenLoginModal} />
        </div>
      </div>
    </header>
  );
};
