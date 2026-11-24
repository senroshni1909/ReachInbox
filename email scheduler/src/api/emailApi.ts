import { apiRequest } from './client';
import type { EmailJob, SchedulePayload, QueueMetrics, FilterOptions } from '../types';
import { INITIAL_SCHEDULED_EMAILS, INITIAL_SENT_EMAILS } from '../utils/mockData';

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

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reachinbox:emails_changed'));
    }

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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reachinbox:emails_changed'));
    }
    return { success: true, isLive: false };
  },

  /**
   * Synchronously compute counts directly from stored email lists
   */
  getCountsSync(): { scheduled: number; sent: number } {
    const scheduled = getStoredScheduled();
    const sent = getStoredSent();
    return {
      scheduled: scheduled.filter(s => s.status === 'scheduled' || s.status === 'delayed').length,
      sent: sent.length,
    };
  },

  /**
   * Get dynamic counts for Scheduled and Sent sidebar badges directly from live backend or storage
   */
  async getCounts(): Promise<{ scheduled: number; sent: number }> {
    try {
      const [liveSched, liveSent] = await Promise.all([
        apiRequest<{ total: number }>('/emails/scheduled?limit=1'),
        apiRequest<{ total: number }>('/emails/sent?limit=1'),
      ]);

      if (liveSched.isLive && liveSched.data && liveSent.data) {
        return {
          scheduled: liveSched.data.total,
          sent: liveSent.data.total,
        };
      }
    } catch {
      // Fallback to local storage
    }

    return this.getCountsSync();
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
      waiting: scheduled.filter(s => s.status === 'scheduled').length,
      active: 0,
      delayed: scheduled.filter(s => s.status === 'delayed').length,
      completed: sent.filter(s => s.status === 'sent').length,
      failed: sent.filter(s => s.status === 'failed').length,
      paused: false,
      totalProcessed: sent.length,
      currentThroughput: 0,
    };

    return { stats, isLive: false };
  },
};
