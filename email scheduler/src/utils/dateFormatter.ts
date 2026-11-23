/**
 * Format date to human-readable string
 */
export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Format date as "Tue 9:15:12 AM" matching exact Figma design
 */
export function formatFigmaTime(isoString?: string | null): string {
  if (!isoString) return 'Tue 9:15:12 AM';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
    const time = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
    return `${weekday} ${time}`;
  } catch {
    return isoString;
  }
}

/**
 * Format relative time (e.g. "in 5 minutes", "2 hours ago")
 */
export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHours = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHours / 24);

    if (Math.abs(diffSec) < 45) {
      return diffSec >= 0 ? 'in a few seconds' : 'just now';
    }
    if (Math.abs(diffMin) < 60) {
      return diffMin > 0 ? `in ${diffMin}m` : `${Math.abs(diffMin)}m ago`;
    }
    if (Math.abs(diffHours) < 24) {
      return diffHours > 0 ? `in ${diffHours}h` : `${Math.abs(diffHours)}h ago`;
    }
    return diffDays > 0 ? `in ${diffDays}d` : `${Math.abs(diffDays)}d ago`;
  } catch {
    return isoString;
  }
}

/**
 * Get local ISO string for datetime-local input fields
 */
export function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
