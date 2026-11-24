import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Archive,
  Trash2,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { INITIAL_SCHEDULED_EMAILS, INITIAL_SENT_EMAILS } from '../../utils/mockData';

export const EmailDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isStarred, setIsStarred] = useState(false);

  // Look up email if exists, or use default from Figma screenshot
  const allEmails = [...INITIAL_SCHEDULED_EMAILS, ...INITIAL_SENT_EMAILS];
  const foundEmail = allEmails.find(e => e.id === id);

  const subject = foundEmail
    ? `${foundEmail.subject} | MJWYT44 BM#52W01`
    : 'Oliver, hello there! | MJWYT44 BM#52W01';

  const senderName = 'Amanda Clark';
  const senderEmail = foundEmail?.sender || 'sender@example.com';
  const dateFormatted = 'Nov 3, 10:23 AM';

  const handleArchive = () => {
    showToast({
      type: 'info',
      title: 'Email archived',
      message: 'The email was moved to your archive.',
    });
    navigate('/dashboard');
  };

  const handleDelete = () => {
    showToast({
      type: 'warning',
      title: 'Email deleted',
      message: 'Email removed from queue / inbox.',
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white text-[#1c1c1c] font-sans antialiased flex flex-col">
      {/* Top Header */}
      <header className="h-[60px] px-6 border-b border-[#f0f1f3] flex items-center justify-between">
        {/* Left: Back Arrow + Subject */}
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 text-[#1c1c1c] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-[#1c1c1c] truncate tracking-tight">
            {subject}
          </h1>
        </div>

        {/* Right: Actions (Star, Archive, Delete, Divider, Avatar) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => setIsStarred(!isStarred)}
            className="p-2 text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Star email"
          >
            <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          <button
            onClick={handleArchive}
            className="p-2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-gray-200 mx-1.5" />

          {/* User Avatar */}
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name || 'Oliver Brown'}
            className="w-7 h-7 rounded-full object-cover border border-gray-200 ml-1 cursor-pointer"
            onClick={() => navigate('/dashboard')}
            title={user?.name || 'Oliver Brown'}
          />
        </div>
      </header>

      {/* Main Email Content */}
      <main className="flex-1 max-w-[860px] w-full mx-auto px-6 py-7 space-y-6">
        {/* Sender Info Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {/* Green Circle Avatar with "A" (#00c950) */}
            <div className="w-10 h-10 rounded-full bg-[#00c950] text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
              A
            </div>

            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-bold text-sm text-[#1c1c1c]">{senderName}</span>
                <span className="text-xs text-[#6b7280]">&lt;{senderEmail}&gt;</span>
              </div>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-[#6b7280] hover:text-[#1c1c1c] mt-0.5 cursor-pointer"
              >
                <span>to me</span>
                <ChevronDown className="w-3 h-3 text-[#9ca3af]" />
              </button>
            </div>
          </div>

          {/* Date / Time */}
          <span className="text-xs text-[#6b7280] shrink-0 font-normal">
            {dateFormatted}
          </span>
        </div>

        {/* Email Body */}
        <div className="space-y-4 text-xs sm:text-[13px] text-[#1c1c1c] leading-relaxed pt-2">
          <p>Hey Oliver,</p>
          <p>You've just RECEIVED something</p>

          {/* Highlighted Yellow Callout Box (#fefce8 bg, #fdce20 left border) */}
          <div className="bg-[#fefce8] border-l-4 border-[#fdce20] p-4 my-4 space-y-1.5 rounded-r-lg">
            <p className="font-bold text-[#1c1c1c] leading-snug">
              ⚡ Extremely Exclusive—Only 4 Spots Worldwide Per Year | $25,000 investment ⚡
            </p>
            <p className="text-[#374151] leading-snug">
              ⚡ To explore securing your private transformation, simply reply right now with <strong className="text-black">"FLY OUT FIX"</strong> .
            </p>
          </div>

          <p className="pt-2">Your coach for world-class performance,</p>
          <p className="font-semibold">Grant</p>

          <p className="italic text-[#4b5563] pt-2">
            P.S. Always remember that you can develop world class technique! 🚀
          </p>
        </div>

        {/* Attachments Section */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-4">
            {/* Attachment 1 */}
            <div className="w-[170px] border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow cursor-pointer bg-white group">
              <div className="h-[95px] bg-[#1e40af] overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400&auto=format&fit=crop&q=80"
                  alt="Tennis Coach Profile"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="p-2.5 bg-[#f9fafb]">
                <p className="text-xs font-semibold text-[#1c1c1c] truncate">Tennis_Coach_Profile.png</p>
                <p className="text-[10px] text-[#6b7280] mt-0.5">1.2 MB</p>
              </div>
            </div>

            {/* Attachment 2 */}
            <div className="w-[170px] border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow cursor-pointer bg-white group">
              <div className="h-[95px] bg-[#1e40af] overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&auto=format&fit=crop&q=80"
                  alt="Tennis Coach Profile 2"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="p-2.5 bg-[#f9fafb]">
                <p className="text-xs font-semibold text-[#1c1c1c] truncate">Tennis_Coach_Profile2.png</p>
                <p className="text-[10px] text-[#6b7280] mt-0.5">1.2 MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ethereal Mail Link if present */}
        {foundEmail?.etherealUrl && (
          <div className="pt-4">
            <a
              href={foundEmail.etherealUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
            >
              <span>View full raw message in Ethereal SMTP</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </main>
    </div>
  );
};
