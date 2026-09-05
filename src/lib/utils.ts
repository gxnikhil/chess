// Utility functions for the chess platform

export function formatRating(rating: number): string {
  return Math.round(rating).toString();
}

export function formatRatingChange(change: number): string {
  if (change > 0) return `+${Math.round(change)}`;
  if (change < 0) return `${Math.round(change)}`;
  return '0';
}

export function getTimeControlFormat(baseTime: number, increment: number): string {
  const minutes = Math.floor(baseTime / 60);
  return `${minutes}+${increment}`;
}

export function classifyTimeControl(baseTime: number, increment: number): string {
  const totalTime = baseTime + (increment * 40); // estimated game time
  if (totalTime < 180) return 'bullet';
  if (totalTime < 600) return 'blitz';
  if (totalTime < 1800) return 'rapid';
  return 'classical';
}

export function formatTime(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}:${remainMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimeMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  
  if (totalSeconds < 10) {
    return `${secs}.${tenths}`;
  }
  if (totalSeconds < 60) {
    return `0:${secs.toString().padStart(2, '0')}.${tenths}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getUsernameInitial(username: string): string {
  return username.charAt(0).toUpperCase();
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateRelative(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateGameId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const TIME_CONTROLS = [
  { label: '1+0', baseTime: 60, increment: 0, format: 'bullet' },
  { label: '2+1', baseTime: 120, increment: 1, format: 'bullet' },
  { label: '3+0', baseTime: 180, increment: 0, format: 'blitz' },
  { label: '3+2', baseTime: 180, increment: 2, format: 'blitz' },
  { label: '5+0', baseTime: 300, increment: 0, format: 'blitz' },
  { label: '5+3', baseTime: 300, increment: 3, format: 'blitz' },
  { label: '10+0', baseTime: 600, increment: 0, format: 'rapid' },
  { label: '10+5', baseTime: 600, increment: 5, format: 'rapid' },
  { label: '15+10', baseTime: 900, increment: 10, format: 'rapid' },
  { label: '30+0', baseTime: 1800, increment: 0, format: 'classical' },
  { label: '30+20', baseTime: 1800, increment: 20, format: 'classical' },
] as const;

export const FORMATS = ['bullet', 'blitz', 'rapid', 'classical', 'chess960'] as const;

export const FORMAT_ICONS: Record<string, string> = {
  bullet: '⚡',
  blitz: '🔥',
  rapid: '⏱️',
  classical: '🏛️',
  chess960: '🎲',
  bot: '🤖',
};

export const FORMAT_LABELS: Record<string, string> = {
  bullet: 'Bullet',
  blitz: 'Blitz',
  rapid: 'Rapid',
  classical: 'Classical',
  chess960: 'Chess960',
  bot: 'Bot',
};

export const TITLE_DISPLAY: Record<string, { label: string; color: string }> = {
  GM: { label: 'GM', color: '#fbbf24' },
  IM: { label: 'IM', color: '#fbbf24' },
  FM: { label: 'FM', color: '#fbbf24' },
  CM: { label: 'CM', color: '#fbbf24' },
  WGM: { label: 'WGM', color: '#f472b6' },
  WIM: { label: 'WIM', color: '#f472b6' },
  WFM: { label: 'WFM', color: '#f472b6' },
  WCM: { label: 'WCM', color: '#f472b6' },
};

export const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', GB: '🇬🇧', IN: '🇮🇳', RU: '🇷🇺', CN: '🇨🇳',
  DE: '🇩🇪', FR: '🇫🇷', ES: '🇪🇸', BR: '🇧🇷', NO: '🇳🇴',
  AM: '🇦🇲', AZ: '🇦🇿', NL: '🇳🇱', PL: '🇵🇱', UA: '🇺🇦',
  IT: '🇮🇹', JP: '🇯🇵', KR: '🇰🇷', AU: '🇦🇺', CA: '🇨🇦',
  AR: '🇦🇷', IR: '🇮🇷', TR: '🇹🇷', SE: '🇸🇪', HU: '🇭🇺',
};

export const OFFENSIVE_WORDS = [
  // Basic profanity filter - extend as needed
  'admin', 'moderator', 'support', 'official', 'staff',
];

export function isUsernameValid(username: string): { valid: boolean; error?: string } {
  if (!username) return { valid: false, error: 'Username is required' };
  if (username.length < 3) return { valid: false, error: 'Username must be at least 3 characters' };
  if (username.length > 20) return { valid: false, error: 'Username must be at most 20 characters' };
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return { valid: false, error: 'Only letters, numbers, and underscores are allowed' };
  if (/^_|_$/.test(username)) return { valid: false, error: 'Username cannot start or end with underscore' };
  
  const lower = username.toLowerCase();
  if (OFFENSIVE_WORDS.some(word => lower.includes(word))) {
    return { valid: false, error: 'This username is not available' };
  }
  
  return { valid: true };
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getWinRate(wins: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((wins / total) * 100);
}

export function getResultText(result: string, playerColor: 'white' | 'black'): { text: string; class: string } {
  if (result === 'draw') return { text: 'Draw', class: 'text-warning' };
  if (result === playerColor) return { text: 'Victory', class: 'text-success' };
  return { text: 'Defeat', class: 'text-error' };
}
