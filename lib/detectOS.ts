export type DetectedOS = 'mac' | 'windows' | 'other';

export function detectOS(): DetectedOS {
  if (typeof navigator === 'undefined') return 'other';
  const ua = `${navigator.userAgent ?? ''} ${navigator.platform ?? ''}`.toLowerCase();
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('win')) return 'windows';
  return 'other';
}
