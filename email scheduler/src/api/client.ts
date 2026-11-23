const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface RequestOptions extends RequestInit {
  timeout?: number;
}

// Track if backend was unreachable on recent attempt to prevent waiting on long timeouts
let isKnownOffline = false;
let lastOfflineCheck = 0;
const OFFLINE_RECHECK_INTERVAL = 15000; // retry live backend check every 15s

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ data: T | null; error: string | null; isLive: boolean }> {
  const now = Date.now();
  // If known offline and checked recently, immediately return fallback
  if (isKnownOffline && now - lastOfflineCheck < OFFLINE_RECHECK_INTERVAL) {
    return {
      data: null,
      error: 'Backend offline (using local persistence mode)',
      isLive: false,
    };
  }

  const { timeout = 1200, ...customConfig } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const headers = {
    'Content-Type': 'application/json',
    ...(customConfig.headers || {}),
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...customConfig,
      headers,
      signal: controller.signal,
    });
    clearTimeout(id);

    if (!response.ok) {
      const errorText = await response.text();
      return { data: null, error: errorText || `HTTP ${response.status}`, isLive: true };
    }

    const data = (await response.json()) as T;
    isKnownOffline = false;
    return { data, error: null, isLive: true };
  } catch (err: any) {
    clearTimeout(id);
    isKnownOffline = true;
    lastOfflineCheck = Date.now();
    return {
      data: null,
      error: err.name === 'AbortError' ? 'Connection timed out' : 'Backend unavailable (running in offline/mock mode)',
      isLive: false,
    };
  }
}
