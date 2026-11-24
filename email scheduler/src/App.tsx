import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LoginPage } from './components/auth/LoginPage';
import { ComposePage } from './components/compose/ComposePage';
import { EmailDetailPage } from './components/dashboard/EmailDetailPage';
import { ComposeModal } from './components/compose/ComposeModal';
import { EmailDetailsModal } from './components/dashboard/EmailDetailsModal';
import { SlackIntegrationModal } from './components/dashboard/SlackIntegrationModal';
import { GoogleLoginModal } from './components/auth/GoogleLoginModal';
import { useEmails } from './hooks/useEmails';
import { useDebounce } from './hooks/useDebounce';
import { emailApi } from './api/emailApi';
import { slackApi } from './api/slackApi';
import type { EmailJob, QueueMetrics, SlackConfig } from './types';
import { INITIAL_QUEUE_METRICS, INITIAL_SLACK_CONFIG } from './utils/mockData';
import { formatFigmaTime } from './utils/dateFormatter';
import {
  Clock,
  Send,
  Search,
  Filter,
  RotateCw,
  Star,
  ChevronDown,
  LogOut,
  Activity,
  Hash,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

function DashboardContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSender] = useState('all');
  const [selectedStatus] = useState('all');
  const [starredJobs, setStarredJobs] = useState<Record<string, boolean>>({});
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Modals state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSlackOpen, setIsSlackOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [inspectingEmail, setInspectingEmail] = useState<EmailJob | null>(null);

  // Queue & Slack state
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics>(INITIAL_QUEUE_METRICS);
  const [slackConfig, setSlackConfig] = useState<SlackConfig>(INITIAL_SLACK_CONFIG);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamic counts for Scheduled and Sent sidebar badges
  const [counts, setCounts] = useState<{ scheduled: number; sent: number }>({
    scheduled: INITIAL_QUEUE_METRICS.waiting + INITIAL_QUEUE_METRICS.delayed,
    sent: INITIAL_QUEUE_METRICS.completed,
  });

  const filterOptions = useMemo(
    () => ({
      search: debouncedSearch,
      sender: selectedSender,
      status: selectedStatus,
    }),
    [debouncedSearch, selectedSender, selectedStatus]
  );

  const {
    emails,
    isLoading,
    refresh,
  } = useEmails(activeTab, filterOptions);

  const loadSystemData = async () => {
    try {
      const [queueRes, slackRes, countRes] = await Promise.all([
        emailApi.getQueueStats(),
        slackApi.getStatus(),
        emailApi.getCounts(),
      ]);
      setQueueMetrics(queueRes.stats);
      setSlackConfig(slackRes.config);
      setCounts({
        scheduled: countRes.scheduledCount,
        sent: countRes.sentCount,
      });
    } catch {
      // Keep defaults
    }
  };

  useEffect(() => {
    loadSystemData();

    // Listen for realtime scheduling/cancellation events across the app
    const handleDataChange = () => {
      loadSystemData();
    };

    window.addEventListener('reachinbox:emails_changed', handleDataChange);
    return () => {
      window.removeEventListener('reachinbox:emails_changed', handleDataChange);
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refresh(), loadSystemData()]);
    setIsRefreshing(false);
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredJobs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const scheduledCount = counts.scheduled;
  const sentCount = counts.sent;

  return (
    <div className="min-h-screen bg-white text-[#1c1c1c] flex font-sans antialiased selection:bg-[#2fb762]/20 selection:text-[#2fb762]">
      {/* 1. Left Sidebar matching exact Figma Design */}
      <aside className="w-[230px] shrink-0 border-r border-[#f0f1f3] p-5 flex flex-col justify-between min-h-screen bg-white">
        <div className="space-y-4">
          {/* Logo "ONB" in bold geometric block font */}
          <div className="pt-1 pb-1">
            <span className="text-[26px] font-black tracking-tight text-black font-mono select-none">
              ONB
            </span>
          </div>

          {/* User Profile Pill Card */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-[#f4f7f5] hover:bg-[#ebf0ec] transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                  alt={user?.name || 'Oliver Brown'}
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#1c1c1c] truncate">
                    {user?.name || 'Oliver Brown'}
                  </p>
                  <p className="text-[10px] text-[#8a929a] font-mono truncate">
                    {user?.email || 'oliver.brown@domain.io'}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#8a929a] shrink-0 ml-1" />
            </button>

            {/* Profile Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-full bg-white border border-[#e5e7eb] rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2 border-b border-gray-100 mb-1">
                  <p className="text-xs font-bold text-gray-900">{user?.name || 'Oliver Brown'}</p>
                  <p className="text-[11px] text-gray-500 font-mono truncate">{user?.email || 'oliver.brown@domain.io'}</p>
                </div>
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    setIsSlackOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <Hash className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Slack Integration</span>
                </button>
                <a
                  href="http://localhost:5000/admin/queues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-purple-600" />
                    <span>BullMQ Arena</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-left mt-1 border-t border-gray-100"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* "Compose" Button (Green Outline Pill) */}
          <button
            onClick={() => navigate('/compose')}
            className="w-full h-[38px] rounded-full border border-[#2fb762] text-[#2fb762] hover:bg-[#e5f6ec]/40 active:bg-[#e5f6ec] text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-sm"
          >
            Compose
          </button>

          {/* Section: CORE */}
          <div className="pt-2">
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider px-2 mb-2">
              CORE
            </p>

            <nav className="space-y-1">
              {/* Scheduled Item */}
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'scheduled'
                    ? 'bg-[#e5f6ec] text-[#1c1c1c]'
                    : 'text-[#4b5563] hover:bg-[#f4f7f5]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className={`w-4 h-4 ${activeTab === 'scheduled' ? 'text-[#1c1c1c]' : 'text-[#6b7280]'}`} />
                  <span>Scheduled</span>
                </div>
                <span className="text-[11px] text-[#6b7280] font-mono">
                  {scheduledCount}
                </span>
              </button>

              {/* Sent Item */}
              <button
                onClick={() => setActiveTab('sent')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'sent'
                    ? 'bg-[#e5f6ec] text-[#1c1c1c]'
                    : 'text-[#4b5563] hover:bg-[#f4f7f5]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Send className={`w-4 h-4 ${activeTab === 'sent' ? 'text-[#1c1c1c]' : 'text-[#6b7280]'}`} />
                  <span>Sent</span>
                </div>
                <span className="text-[11px] text-[#6b7280] font-mono">
                  {sentCount}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: System Status */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <div
            onClick={() => setIsSlackOpen(true)}
            className="flex items-center justify-between text-[11px] text-gray-500 hover:text-gray-900 cursor-pointer p-1 rounded hover:bg-gray-50"
          >
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${slackConfig.connected ? 'bg-[#2fb762]' : 'bg-amber-400'}`} />
              <span>Slack Alerts</span>
            </span>
            <span className="text-[10px] text-gray-400">{slackConfig.connected ? 'Active' : 'Off'}</span>
          </div>

          <a
            href="http://localhost:5000/admin/queues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-[11px] text-gray-500 hover:text-gray-900 cursor-pointer p-1 rounded hover:bg-gray-50"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2fb762] animate-pulse" />
              <span>BullMQ Queue</span>
            </span>
            <span className="text-[10px] text-gray-400">{queueMetrics.active} active</span>
          </a>
        </div>
      </aside>

      {/* 2. Main Content Area matching exact Figma Design */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Top Search & Actions Row */}
        <header className="p-5 pb-4 flex items-center justify-between gap-4 border-b border-[#f0f1f3]">
          <div className="flex items-center gap-3 flex-1 max-w-[540px]">
            {/* Pill-shaped Search Bar */}
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-[#9ca3af] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full h-[36px] bg-[#f4f7f5] text-[#1c1c1c] placeholder-[#9ca3af] text-xs pl-9 pr-4 rounded-full border-0 outline-none focus:ring-1 focus:ring-[#2fb762] transition-all"
              />
            </div>

            {/* Filter Icon */}
            <button
              onClick={() => {}}
              className="p-1.5 text-[#6b7280] hover:text-[#1c1c1c] transition-colors cursor-pointer"
              title="Filter"
            >
              <Filter className="w-4 h-4" />
            </button>

            {/* Refresh Icon */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`p-1.5 text-[#6b7280] hover:text-[#1c1c1c] transition-colors cursor-pointer ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              title="Refresh Queue"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Quick status pill for demonstration */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2fb762]" />
              <span>Rate Limit: {queueMetrics.waiting} queued</span>
            </span>
          </div>
        </header>

        {/* Email Rows List matching exact Figma design */}
        <div className="flex-1 p-5 pt-3 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4 pt-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 animate-pulse py-2">
                  <div className="h-4 w-28 bg-gray-100 rounded" />
                  <div className="h-6 w-32 bg-gray-100 rounded-full" />
                  <div className="h-4 w-96 bg-gray-100 rounded flex-1" />
                </div>
              ))}
            </div>
          ) : emails.length === 0 ? (
            <div className="py-20 text-center">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No {activeTab} emails found</p>
              <p className="text-xs text-gray-400 mt-0.5">Click "Compose" to schedule outbound emails</p>
            </div>
          ) : (
            <div className="divide-y divide-transparent space-y-1">
              {emails.map(email => {
                const isStarred = starredJobs[email.id] || false;
                const recipientDisplay = email.recipientName || email.recipient.split('@')[0];

                return (
                  <div
                    key={email.id}
                    onClick={() => navigate(`/email/${email.id}`)}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#fafbfa] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Recipient */}
                      <div className="w-[130px] shrink-0 font-semibold text-xs text-[#1c1c1c] truncate">
                        To: {recipientDisplay}
                      </div>

                      {/* Orange/Peach Scheduled Time Pill */}
                      <div className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff1e3] text-[#d45828] text-[11px] font-medium border border-[#ffe0c2]/50 shadow-xs">
                        <Clock className="w-3 h-3 text-[#d45828]" />
                        <span>{formatFigmaTime(email.scheduledTime || email.sentTime)}</span>
                      </div>

                      {/* Subject and Snippet */}
                      <div className="min-w-0 flex-1 flex items-baseline gap-1 text-xs truncate">
                        <span className="font-semibold text-[#1c1c1c] shrink-0">
                          {email.subject}
                        </span>
                        <span className="text-[#8a929a] truncate font-normal">
                          - {email.body.replace(/\n+/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Star Icon on the right */}
                    <button
                      onClick={e => toggleStar(email.id, e)}
                      className="p-1 text-gray-300 hover:text-amber-400 transition-colors ml-3 cursor-pointer shrink-0"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isStarred ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-400'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onScheduledSuccess={() => {
          refresh();
          loadSystemData();
        }}
      />

      <EmailDetailsModal
        email={inspectingEmail}
        isOpen={!!inspectingEmail}
        onClose={() => setInspectingEmail(null)}
      />

      <SlackIntegrationModal
        isOpen={isSlackOpen}
        onClose={() => setIsSlackOpen(false)}
        config={slackConfig}
        onConfigUpdated={newConfig => setSlackConfig(newConfig)}
      />

      <GoogleLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-white" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function MainRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardContent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compose"
        element={
          <ProtectedRoute>
            <ComposePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/email/:id"
        element={
          <ProtectedRoute>
            <EmailDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/email"
        element={
          <ProtectedRoute>
            <EmailDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <MainRouter />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
