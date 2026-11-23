import { useState, useEffect, useCallback, useRef } from 'react';
import type { EmailJob, FilterOptions } from '../types';
import { emailApi } from '../api/emailApi';
import { useToast } from '../context/ToastContext';

export function useEmails(activeTab: 'scheduled' | 'sent', filterOptions: FilterOptions) {
  const [emails, setEmails] = useState<EmailJob[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);
  const { showToast } = useToast();

  const { search = '', sender = 'all', status = 'all', page = 1, limit = 50 } = filterOptions;

  // Keep a stable ref for toast to prevent recreation of callback
  const toastRef = useRef(showToast);
  toastRef.current = showToast;

  const loadEmails = useCallback(async () => {
    setIsLoading(true);
    try {
      const options: FilterOptions = { search, sender, status, page, limit };
      if (activeTab === 'scheduled') {
        const res = await emailApi.getScheduled(options);
        setEmails(res.data);
        setTotal(res.total);
        setIsLiveBackend(res.isLive);
      } else {
        const res = await emailApi.getSent(options);
        setEmails(res.data);
        setTotal(res.total);
        setIsLiveBackend(res.isLive);
      }
    } catch {
      toastRef.current({
        type: 'error',
        title: 'Error loading emails',
        message: 'Could not fetch records. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, search, sender, status, page, limit]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  const cancelJob = async (id: string) => {
    try {
      const res = await emailApi.cancelScheduled(id);
      if (res.success) {
        setEmails(prev => prev.filter(e => e.id !== id));
        setTotal(prev => Math.max(0, prev - 1));
        toastRef.current({
          type: 'success',
          title: 'Job cancelled',
          message: 'The scheduled email job was removed from queue.',
        });
      }
    } catch {
      toastRef.current({
        type: 'error',
        title: 'Failed to cancel',
        message: 'Could not remove job from BullMQ queue.',
      });
    }
  };

  return {
    emails,
    total,
    isLoading,
    isLiveBackend,
    refresh: loadEmails,
    cancelJob,
  };
}
