import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Paperclip,
  Clock,
  Calendar,
  ChevronDown,
  RotateCcw,
  RotateCw,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  ChevronsUpDown,
  ListOrdered,
  List,
  Indent,
  Outdent,
  Quote,
  Link,
  Strikethrough,
  X,
  CheckCircle2,
} from 'lucide-react';
import { emailApi } from '../../api/emailApi';
import { useToast } from '../../context/ToastContext';
import { AVAILABLE_SENDERS } from '../../utils/mockData';
import { parseEmailList } from '../../utils/csvParser';
import { toDatetimeLocal } from '../../utils/dateFormatter';

export const ComposePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [sender, setSender] = useState(AVAILABLE_SENDERS[0]);
  const [toInput, setToInput] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(3);
  const [hourlyLimit, setHourlyLimit] = useState(50);

  // Send Later Popover state
  const [isSendLaterOpen, setIsSendLaterOpen] = useState(false);
  const defaultStartTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  const [scheduledStartTime, setScheduledStartTime] = useState(toDatetimeLocal(defaultStartTime));
  const [selectedQuickSchedule, setSelectedQuickSchedule] = useState<string | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [senderDropdownOpen, setSenderDropdownOpen] = useState(false);

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = ev => {
        const text = ev.target?.result as string;
        if (text) {
          const result = parseEmailList(text);
          if (result.validEmails.length > 0) {
            setRecipients(result.validEmails);
            setToInput(result.validEmails.slice(0, 3).join(', ') + (result.validEmails.length > 3 ? ` +${result.validEmails.length - 3} more` : ''));
            showToast({
              type: 'success',
              title: 'Leads loaded from CSV',
              message: `${result.validEmails.length} valid email addresses detected!`,
            });
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleQuickSchedule = (label: string, hoursAhead: number, setExactTime?: { hour: number; min: number }) => {
    setSelectedQuickSchedule(label);
    const target = new Date();
    if (setExactTime) {
      target.setDate(target.getDate() + 1);
      target.setHours(setExactTime.hour, setExactTime.min, 0, 0);
    } else {
      target.setTime(target.getTime() + hoursAhead * 60 * 60 * 1000);
    }
    setScheduledStartTime(toDatetimeLocal(target));
  };

  const handleSend = async () => {
    let finalRecipients = recipients;
    if (finalRecipients.length === 0 && toInput.trim()) {
      const parsed = parseEmailList(toInput);
      finalRecipients = parsed.validEmails;
    }

    if (finalRecipients.length === 0) {
      showToast({
        type: 'error',
        title: 'Recipient required',
        message: 'Please enter a recipient email or upload a leads CSV.',
      });
      return;
    }

    if (!subject.trim()) {
      showToast({
        type: 'error',
        title: 'Subject required',
        message: 'Please enter a subject line for your email.',
      });
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        sender,
        subject,
        body: body.trim() || 'Hello, following up on our conversation.',
        recipients: finalRecipients,
        startTime: new Date(scheduledStartTime).toISOString(),
        delayBetweenEmails: Number(delaySeconds) || 2,
        hourlyLimit: Number(hourlyLimit) || 50,
      };

      const res = await emailApi.scheduleEmails(payload);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Campaign scheduled!',
          message: `${res.scheduledCount} email job(s) queued for ${new Date(scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        });
        navigate('/dashboard');
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Error scheduling emails',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1c1c1c] font-sans flex flex-col relative">
      {/* Hidden CSV File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Header */}
      <header className="h-[60px] px-6 border-b border-[#f0f1f3] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 text-[#1c1c1c] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-[#1c1c1c]">Compose New Email</h1>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-3 relative">
          {/* Attach CSV leads */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            title="Attach CSV/Text lead list"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Clock (Send Later Toggle) */}
          <button
            onClick={() => setIsSendLaterOpen(!isSendLaterOpen)}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isSendLaterOpen ? 'text-[#30b662] bg-[#e5f6ec]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Schedule / Send Later"
          >
            <Clock className="w-5 h-5" />
          </button>

          {/* Send Button (#30b662 outline pill) */}
          <button
            onClick={handleSend}
            disabled={isSending}
            className="h-[34px] px-6 rounded-full border border-[#30b662] text-[#30b662] hover:bg-[#e5f6ec]/40 active:bg-[#e5f6ec] text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-60"
          >
            {isSending ? 'Scheduling...' : 'Send'}
          </button>

          {/* "Send Later" Popover Dialog matching exact Figma Screenshot */}
          {isSendLaterOpen && (
            <div className="absolute top-[48px] right-0 w-[280px] bg-white border border-[#f0f1f3] rounded-2xl shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
              <h3 className="text-sm font-bold text-[#1c1c1c] mb-4">Send Later</h3>

              {/* Pick date & time */}
              <div className="relative mb-4 pb-1 border-b border-[#e5e7eb]">
                <input
                  type="datetime-local"
                  value={scheduledStartTime}
                  onChange={e => {
                    setScheduledStartTime(e.target.value);
                    setSelectedQuickSchedule(null);
                  }}
                  className="w-full text-xs text-gray-700 bg-transparent outline-none pr-6 cursor-pointer"
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Quick suggestions */}
              <div className="space-y-2 mb-6">
                {[
                  { label: 'Tomorrow', hours: 24 },
                  { label: 'Tomorrow, 10:00 AM', exact: { hour: 10, min: 0 } },
                  { label: 'Tomorrow, 11:00 AM', exact: { hour: 11, min: 0 } },
                  { label: 'Tomorrow, 3:00 PM', exact: { hour: 15, min: 0 } },
                ].map(item => (
                  <div
                    key={item.label}
                    onClick={() => handleQuickSchedule(item.label, item.hours || 24, item.exact)}
                    className={`text-xs py-1 px-1.5 rounded cursor-pointer transition-colors ${
                      selectedQuickSchedule === item.label
                        ? 'text-[#30b662] font-semibold bg-[#e5f6ec]'
                        : 'text-gray-600 hover:text-black hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Popover bottom actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSendLaterOpen(false)}
                  className="text-xs font-semibold text-gray-800 hover:text-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setIsSendLaterOpen(false)}
                  className="h-[28px] px-4 rounded-full border border-[#30b662] text-[#30b662] hover:bg-[#e5f6ec]/40 text-xs font-semibold flex items-center justify-center transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Form Body */}
      <div className="flex-1 max-w-[900px] w-full mx-auto px-8 py-6 space-y-4">
        {/* Row 1: From */}
        <div className="flex items-center gap-6">
          <span className="w-12 text-xs font-medium text-gray-600">From</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSenderDropdownOpen(!senderDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f5f5f5] hover:bg-[#ebebeb] text-xs font-semibold text-gray-800 transition-colors cursor-pointer"
            >
              <span>{sender}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {senderDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 z-40">
                {AVAILABLE_SENDERS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSender(s);
                      setSenderDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                      sender === s ? 'bg-[#e5f6ec] text-[#30b662] font-semibold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: To */}
        <div className="flex items-center gap-6 border-b border-[#f5f5f5] pb-2">
          <span className="w-12 text-xs font-medium text-gray-600">To</span>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={toInput}
              onChange={e => {
                setToInput(e.target.value);
                setRecipients([]);
              }}
              placeholder="recipient@example.com"
              className="w-full text-xs text-gray-800 placeholder-gray-400 outline-none bg-transparent"
            />
            {recipients.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e5f6ec] text-[#30b662] text-[11px] font-semibold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{recipients.length} leads loaded</span>
                <button
                  type="button"
                  onClick={() => {
                    setRecipients([]);
                    setToInput('');
                  }}
                  className="hover:text-rose-500 ml-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Subject */}
        <div className="flex items-center gap-6 border-b border-[#f5f5f5] pb-2">
          <span className="w-12 text-xs font-medium text-gray-600">Subject</span>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 text-xs text-gray-800 placeholder-gray-400 outline-none bg-transparent"
          />
        </div>

        {/* Row 4: Delay between 2 emails & Hourly Limit */}
        <div className="flex items-center gap-8 pt-1 pb-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-700">Delay between 2 emails</span>
            <input
              type="number"
              min={1}
              max={120}
              value={delaySeconds}
              onChange={e => setDelaySeconds(Number(e.target.value))}
              placeholder="00"
              className="w-[50px] h-[30px] rounded-lg border border-[#e5e7eb] text-center text-xs text-gray-800 outline-none focus:border-[#30b662]"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-700">Hourly Limit</span>
            <input
              type="number"
              min={1}
              max={1000}
              value={hourlyLimit}
              onChange={e => setHourlyLimit(Number(e.target.value))}
              placeholder="00"
              className="w-[50px] h-[30px] rounded-lg border border-[#e5e7eb] text-center text-xs text-gray-800 outline-none focus:border-[#30b662]"
            />
          </div>
        </div>

        {/* Row 5: Text Editor Area matching exact #fafafa rounded box */}
        <div className="bg-[#fafafa] border border-[#f0f0f2] rounded-2xl p-4 min-h-[360px] flex flex-col space-y-3">
          {/* Editor Toolbar matching exact icons */}
          <div className="flex items-center gap-4 text-gray-400 border-b border-[#ebebeb] pb-3 text-xs overflow-x-auto select-none">
            <button type="button" className="hover:text-black cursor-pointer"><RotateCcw className="w-3.5 h-3.5" /></button>
            <button type="button" className="hover:text-black cursor-pointer"><RotateCw className="w-3.5 h-3.5" /></button>
            <div className="h-3 w-px bg-gray-200" />
            <button type="button" className="hover:text-black cursor-pointer font-serif font-bold text-xs flex items-center gap-0.5">Tt <ChevronsUpDown className="w-2.5 h-2.5" /></button>
            <button type="button" className="hover:text-black cursor-pointer"><Bold className="w-3.5 h-3.5" /></button>
            <button type="button" className="hover:text-black cursor-pointer"><Italic className="w-3.5 h-3.5" /></button>
            <button type="button" className="hover:text-black cursor-pointer"><Underline className="w-3.5 h-3.5" /></button>
            <div className="h-3 w-px bg-gray-200" />
            <button type="button" className="hover:text-black cursor-pointer"><AlignLeft className="w-3.5 h-3.5" /></button>
            <button type="button" className="hover:text-black cursor-pointer"><ChevronsUpDown className="w-3.5 h-3.5" /></button>
            <div className="h-3 w-px bg-gray-200" />
            <button type="button" className="hover:text-black cursor-pointer"><ListOrdered className="w-3.5 h-3.5" /></button>
            <button type="button" className="hover:text-black cursor-pointer"><List className="w-3.5 h-3.5" /></button>
            <button type="button" className="hover:text-black cursor-pointer"><Outdent className="w-3.5 h-3.5" /></button>
            <button type="button" className="hover:text-black cursor-pointer"><Indent className="w-3.5 h-3.5" /></button>
            <div className="h-3 w-px bg-gray-200" />
            <button type="button" className="hover:text-black cursor-pointer"><Quote className="w-3.5 h-3.5" /></button>
            <button type="button" className="hover:text-black cursor-pointer"><Link className="w-3.5 h-3.5" /></button>
            <button type="button" className="hover:text-black cursor-pointer"><Strikethrough className="w-3.5 h-3.5" /></button>
          </div>

          {/* Text Area */}
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Type Your Reply..."
            className="flex-1 w-full bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none resize-none leading-relaxed min-h-[280px]"
          />
        </div>
      </div>
    </div>
  );
};
