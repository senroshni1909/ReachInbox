import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Trash2,
  ExternalLink,
  Send,
  AlertCircle,
  Copy,
  Check,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { emailApi } from '../../api/emailApi';
import type { EmailJob } from '../../types';
import { formatDateTime } from '../../utils/dateFormatter';

export const EmailDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState<EmailJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarred, setIsStarred] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadEmail() {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await emailApi.getEmailById(id);
        if (res.data) {
          setEmail(res.data);
        } else {
          showToast({
            type: 'error',
            title: 'Email not found',
            message: 'Could not find the requested email in the database.',
          });
        }
      } catch {
        showToast({
          type: 'error',
          title: 'Error loading email',
          message: 'Failed to fetch email details from database.',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadEmail();
  }, [id]);

  const handleCopyBody = () => {
    if (!email) return;
    navigator.clipboard.writeText(email.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await emailApi.cancelScheduled(id);
      showToast({
        type: 'warning',
        title: 'Email removed',
        message: 'The email was removed from queue / database.',
      });
      navigate('/dashboard');
    } catch {
      showToast({
        type: 'error',
        title: 'Failed to delete',
        message: 'Could not delete email from database.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#30b662]" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-lg font-bold text-gray-800">Email Not Found</h2>
        <p className="text-xs text-gray-500">The requested email does not exist in the database.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 rounded-full border border-[#30b662] text-[#30b662] text-xs font-semibold hover:bg-[#e5f6ec]/40 cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const senderInitial = email.sender ? email.sender[0].toUpperCase() : 'O';
  const displayDate = email.sentTime
    ? formatDateTime(email.sentTime)
    : formatDateTime(email.scheduledTime);

  return (
    <div className="min-h-screen bg-white text-[#1c1c1c] font-sans antialiased flex flex-col">
      {/* Top Header */}
      <header className="h-[60px] px-6 border-b border-[#f0f1f3] flex items-center justify-between">
        {/* Left: Back Arrow + Real Subject */}
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 text-[#1c1c1c] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-[#1c1c1c] truncate tracking-tight">
            {email.subject}
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={() => setIsStarred(!isStarred)}
            className="p-2 text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Star email"
          >
            <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          <button
            onClick={handleCopyBody}
            className="p-2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            title="Copy email text"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
            title="Delete from database"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-gray-200 mx-1.5" />

          {/* User Profile Pill Avatar */}
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
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="flex items-start gap-3.5">
            {/* Green Circle Avatar */}
            <div className="w-10 h-10 rounded-full bg-[#00c950] text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
              {senderInitial}
            </div>

            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-bold text-sm text-[#1c1c1c]">
                  {email.recipientName || email.sender.split('@')[0]}
                </span>
                <span className="text-xs text-[#6b7280]">&lt;{email.sender}&gt;</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                To: <span className="text-gray-800 font-medium">{email.recipient}</span>
              </p>
            </div>
          </div>

          {/* Status & Date */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-[#6b7280] font-mono">
              {displayDate}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
              email.status === 'sent'
                ? 'bg-emerald-100 text-emerald-700'
                : email.status === 'scheduled'
                ? 'bg-[#e5f6ec] text-[#30b662]'
                : email.status === 'delayed'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-rose-100 text-rose-700'
            }`}>
              {email.status}
            </span>
          </div>
        </div>

        {/* Real Dynamic Email Body */}
        <div className="pt-2">
          {/<[a-z][\s\S]*>/i.test(email.body) ? (
            <div
              className="rich-editor text-sm text-[#1c1c1c] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: email.body }}
            />
          ) : (
            <div className="text-sm text-[#1c1c1c] leading-relaxed whitespace-pre-wrap">
              {email.body}
            </div>
          )}
        </div>

        {/* Attachments (if attached to this email) */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Attachments ({email.attachments.length})
            </h4>
            <div className="flex items-center gap-4 flex-wrap">
              {email.attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="w-[160px] bg-white border border-[#e5e7eb] rounded-xl overflow-hidden shadow-xs"
                >
                  <div className="h-[105px] w-full bg-[#f3f4f6] flex items-center justify-center overflow-hidden">
                    {att.contentType?.startsWith('image/') || att.dataUrl?.startsWith('data:image/') || att.content?.startsWith('data:image/') ? (
                      <img
                        src={att.dataUrl || att.content}
                        alt={att.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-gray-400">
                        <FileText className="w-8 h-8 text-gray-400" />
                        <span className="text-[10px] uppercase font-semibold">
                          {att.filename.split('.').pop() || 'FILE'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 bg-white border-t border-gray-100">
                    <p className="text-xs font-semibold text-[#1c1c1c] truncate" title={att.filename}>
                      {att.filename}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {att.formattedSize || 'Attachment'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Ethereal SMTP Link */}
        {email.etherealUrl && (
          <div className="pt-6 border-t border-gray-100">
            <a
              href={email.etherealUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>Inspect Delivered Message on Ethereal SMTP</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>
        )}
      </main>
    </div>
  );
};
