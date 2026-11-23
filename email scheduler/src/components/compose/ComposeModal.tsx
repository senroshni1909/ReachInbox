import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input, Textarea } from '../common/Input';
import { Button } from '../common/Button';
import { CsvUploader } from './CsvUploader';
import { SchedulePreview } from './SchedulePreview';
import { AVAILABLE_SENDERS } from '../../utils/mockData';
import { toDatetimeLocal } from '../../utils/dateFormatter';
import { emailApi } from '../../api/emailApi';
import { useToast } from '../../context/ToastContext';
import { Send, Layers } from 'lucide-react';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduledSuccess: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  onScheduledSuccess,
}) => {
  const { showToast } = useToast();

  // Form states
  const [sender, setSender] = useState(AVAILABLE_SENDERS[0]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  
  // Scheduling controls
  const defaultStartTime = new Date(Date.now() + 5 * 60 * 1000); // 5 mins from now
  const [startTime, setStartTime] = useState(toDatetimeLocal(defaultStartTime));
  const [delaySeconds, setDelaySeconds] = useState(3);
  const [hourlyLimit, setHourlyLimit] = useState(50);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const insertVariable = (tag: string) => {
    setBody(prev => `${prev} {{${tag}}}`);
  };

  const handleQuickTime = (minutesAhead: number) => {
    const target = new Date(Date.now() + minutesAhead * 60 * 1000);
    setStartTime(toDatetimeLocal(target));
  };

  const handleSetTomorrowMorning = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setStartTime(toDatetimeLocal(tomorrow));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (!body.trim()) newErrors.body = 'Email body is required';
    if (recipients.length === 0) newErrors.recipients = 'Please provide at least one recipient email address';
    if (!startTime) newErrors.startTime = 'Start time is required';
    if (delaySeconds < 1) newErrors.delaySeconds = 'Minimum delay must be at least 1 second (recommended 2s+)';
    if (hourlyLimit < 1) newErrors.hourlyLimit = 'Hourly limit must be at least 1';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        sender,
        subject,
        body,
        recipients,
        startTime: new Date(startTime).toISOString(),
        delayBetweenEmails: Number(delaySeconds),
        hourlyLimit: Number(hourlyLimit),
      };

      const res = await emailApi.scheduleEmails(payload);
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Emails scheduled successfully!',
          message: `${res.scheduledCount} jobs pushed to BullMQ delayed queue with ${delaySeconds}s pacing.`,
        });
        onScheduledSuccess();
        onClose();
        setSubject('');
        setBody('');
        setRecipients([]);
      } else {
        showToast({
          type: 'error',
          title: 'Scheduling failed',
          message: 'Could not enqueue email jobs. Please check backend connection.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Error submitting schedule',
        message: 'Network error or backend unavailable.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compose & Schedule Outbound Campaign"
      description="Configure sender credentials, upload leads, and set rate-limiting policies for BullMQ."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Sender & Content */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                From (Sender Email)
              </label>
              <select
                value={sender}
                onChange={e => setSender(e.target.value)}
                className="w-full bg-[#161822] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {AVAILABLE_SENDERS.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Email Subject"
                placeholder="e.g. Transforming cold outbound with AI workflows"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                error={errors.subject}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Email Body
              </label>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>Variables:</span>
                {['firstName', 'company', 'email'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertVariable(tag)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-mono text-[10px] cursor-pointer"
                  >
                    {`{{${tag}}}`}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Hi {{firstName}},\n\nI noticed {{company}} is scaling lead generation. ReachInbox automates verified email sequencing with high inbox deliverability..."
              rows={4}
              value={body}
              onChange={e => setBody(e.target.value)}
              error={errors.body}
            />
          </div>
        </div>

        {/* Step 2: Leads & CSV Upload */}
        <div className="pt-2 border-t border-slate-800/80">
          <CsvUploader
            onEmailsParsed={setRecipients}
            parsedEmails={recipients}
          />
          {errors.recipients && (
            <p className="text-xs text-rose-400 font-medium mt-1.5">{errors.recipients}</p>
          )}
        </div>

        {/* Step 3: Scheduling & Rate Limiting Controls */}
        <div className="pt-2 border-t border-slate-800/80 space-y-4">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Scheduling, Delay & Rate Limiting Policies</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Start Time */}
            <div className="sm:col-span-1 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-[#161822] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickTime(5)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  +5m
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickTime(60)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  +1h
                </button>
                <button
                  type="button"
                  onClick={handleSetTomorrowMorning}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Tmrw 9am
                </button>
              </div>
            </div>

            {/* Delay between each send */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Delay Between Sends
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={delaySeconds}
                  onChange={e => setDelaySeconds(Number(e.target.value))}
                  className="w-full bg-[#161822] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <span className="text-xs text-slate-400 font-mono">sec</span>
              </div>
              <p className="text-[10px] text-slate-500">Mimics provider throttling</p>
            </div>

            {/* Hourly Rate Limit */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Hourly Limit / Sender
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={hourlyLimit}
                  onChange={e => setHourlyLimit(Number(e.target.value))}
                  className="w-full bg-[#161822] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <span className="text-xs text-slate-400 font-mono">/hr</span>
              </div>
              <p className="text-[10px] text-slate-500">Triggers Slack notification</p>
            </div>
          </div>

          {/* Schedule dynamic projection */}
          <SchedulePreview
            totalLeads={recipients.length}
            startTime={startTime}
            delaySeconds={delaySeconds}
            hourlyLimit={hourlyLimit}
            sender={sender}
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Schedule {recipients.length > 0 ? `${recipients.length} Emails` : 'Campaign'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
