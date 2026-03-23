
/**
 * Utility for handling Nepal Time (UTC+5:45)
 */

export function getNepalTime(date: Date = new Date()): Date {
  // Nepal is UTC+5:45
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const nepalOffset = 5.75 * 3600000;
  return new Date(utc + nepalOffset);
}

export function formatNepalDateID(date: Date = new Date()): string {
  const nepal = getNepalTime(date);
  const yyyy = nepal.getFullYear();
  const mm = String(nepal.getMonth() + 1).padStart(2, '0');
  const dd = String(nepal.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function startOfNepalDay(date: Date = new Date()): Date {
  const nepal = getNepalTime(date);
  nepal.setHours(0, 0, 0, 0);
  // Convert back to UTC for Firestore queries if necessary, 
  // but usually we compare Nepal timestamps directly
  return nepal;
}

export function endOfNepalDay(date: Date = new Date()): Date {
  const nepal = getNepalTime(date);
  nepal.setHours(23, 59, 59, 999);
  return nepal;
}

export const NEPALI_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangshir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];
