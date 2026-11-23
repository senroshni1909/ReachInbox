import { apiRequest } from './client';
import type { EmailJob, SchedulePayload, QueueMetrics, FilterOptions } from '../types';
import { INITIAL_SCHEDULED_EMAILS, INITIAL_SENT_EMAILS, INITIAL_QUEUE_METRICS } from '../utils/mockData';

const LOCAL_STORAGE_KEY_SCHEDULED = 'reachinbox_scheduled_jobs_v1';
const LOCAL_STORAGE_KEY_SENT = 'reachinbox_sent_jobs_v1';

// Initialize localStorage with mock data if not present
function getStoredScheduled(): EmailJob[] {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SCHEDULED);
  if (!raw) {
    localStorage.setItem(LOCAL_STORAGE_KEY_SCHEDULED, JSON.stringify(INITIAL_SCHEDULED_EMAILS));
    return INITIAL_SCHEDULED_EMAILS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_SCHEDULED_EMAILS;
  }
}

function getStoredSent(): EmailJob[] {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SENT);
  if (!raw) {
    localStorage.setItem(LOCAL_STORAGE_KEY_SENT, JSON.stringify(INITIAL_SENT_EMAILS));
    return INITIAL_SENT_EMAILS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_SENT_EMAILS;
  }
}

export const emailApi = {
  /**
   * Schedule new batch of emails
   */
  async scheduleEmails(payload: SchedulePayload): Promise<{ success: boolean; scheduledCount: number; jobs: EmailJob[]; isLive: boolean }> {
    const liveResponse = await apiRequest<{ success: boolean; scheduledCount: number; jobs: EmailJob[] }>('/emails/schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (liveResponse.isLive && liveResponse.data?.success) {
      return { ...liveResponse.data, isLive: true };
    }

    // Fallback: Local simulation of BullMQ delayed scheduling
    const existing = getStoredScheduled();
    const startTimeMs = new Date(payload.startTime).getTime();
    const newJobs: EmailJob[] = payload.recipients.map((recipient, index) => {
      // Calculate delay pacing
      const delayMs = index * (payload.delayBetweenEmails * 1000);
      const scheduledDate = new Date(startTimeMs + delayMs);
      const hourIndex = Math.floor(index / payload.hourlyLimit);
      
      // If exceeds hourly limit, push into next hour windows
      const adjustedDate = new Date(scheduledDate.getTime() + hourIndex * 3600 * 1000);

      return {
        id: `job_${Date.now()}_${index}`,
        recipient,
        sender: payload.sender,
        subject: payload.subject,
        body: payload.body,
        scheduledTime: adjustedDate.toISOString(),
        status: hourIndex > 0 ? 'delayed' : 'scheduled',
        delaySeconds: payload.delayBetweenEmails,
        delayBetweenEmails: payload.delayBetweenEmails,
        hourlyLimit: payload.hourlyLimit,
        createdAt: new Date().toISOString(),
        tags: [`Delay: ${payload.delayBetweenEmails}s`, `Limit: ${payload.hourlyLimit}/hr`],
      };
    });

    const updated = [...newJobs, ...existing];
    localStorage.setItem(LOCAL_STORAGE_KEY_SCHEDULED, JSON.stringify(updated));

    return {
      success: true,
      scheduledCount: newJobs.length,
      jobs: newJobs,
      isLive: false,
    };
  },

  /**
   * Fetch scheduled emails with optional search & filters
   */
  async getScheduled(params?: FilterOptions): Promise<{ data: EmailJob[]; total: number; isLive: boolean }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('q', params.search);
    if (params?.sender) query.append('sender', params.sender);
    if (params?.status) query.append('status', params.status);

    const live = await apiRequest<{ emails: EmailJob[]; total: number }>(`/emails/scheduled?${query.toString()}`);
    if (live.isLive && live.data) {
      return { data: live.data.emails, total: live.data.total, isLive: true };
    }

    // Fallback: filter local jobs
    let items = getStoredScheduled();
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        item => item.recipient.toLowerCase().includes(q) || item.subject.toLowerCase().includes(q) || item.body.toLowerCase().includes(q)
      );
    }
    if (params?.sender && params.sender !== 'all') {
      items = items.filter(item => item.sender === params.sender);
    }
    if (params?.status && params.status !== 'all') {
      items = items.filter(item => item.status === params.status);
    }

    return { data: items, total: items.length, isLive: false };
  },

  /**
   * Fetch sent emails
   */
  async getSent(params?: FilterOptions): Promise<{ data: EmailJob[]; total: number; isLive: boolean }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('q', params.search);
    if (params?.sender) query.append('sender', params.sender);
    if (params?.status) query.append('status', params.status);

    const live = await apiRequest<{ emails: EmailJob[]; total: number }>(`/emails/sent?${query.toString()}`);
    if (live.isLive && live.data) {
      return { data: live.data.emails, total: live.data.total, isLive: true };
    }

    let items = getStoredSent();
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        item => item.recipient.toLowerCase().includes(q) || item.subject.toLowerCase().includes(q) || item.body.toLowerCase().includes(q)
      );
    }
    if (params?.sender && params.sender !== 'all') {
      items = items.filter(item => item.sender === params.sender);
    }
    if (params?.status && params.status !== 'all') {
      items = items.filter(item => item.status === params.status);
    }

    return { data: items, total: items.length, isLive: false };
  },

  /**
   * Cancel / delete a scheduled email
   */
  async cancelScheduled(id: string): Promise<{ success: boolean; isLive: boolean }> {
    const live = await apiRequest<{ success: boolean }>(`/emails/scheduled/${id}`, {
      method: 'DELETE',
    });
    if (live.isLive && live.data?.success) {
      return { success: true, isLive: true };
    }

    const items = getStoredScheduled().filter(item => item.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY_SCHEDULED, JSON.stringify(items));
    return { success: true, isLive: false };
  },

  /**
   * Get BullMQ queue statistics
   */
  async getQueueStats(): Promise<{ stats: QueueMetrics; isLive: boolean }> {
    const live = await apiRequest<{ stats: QueueMetrics }>('/queue/stats');
    if (live.isLive && live.data?.stats) {
      return { stats: live.data.stats, isLive: true };
    }

    const scheduled = getStoredScheduled();
    const sent = getStoredSent();

    const stats: QueueMetrics = {
      ...INITIAL_QUEUE_METRICS,
      waiting: scheduled.filter(s => s.status === 'scheduled').length,
      delayed: scheduled.filter(s => s.status === 'delayed').length,
      completed: sent.filter(s => s.status === 'sent').length + 840,
      failed: sent.filter(s => s.status === 'failed').length + 3,
    };

    return { stats, isLive: false };
  },
};
