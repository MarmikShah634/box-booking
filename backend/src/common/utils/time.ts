const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/**
 * Convert an IST calendar date string (YYYY-MM-DD) to UTC midnight of that IST day.
 * IST midnight = previous UTC day at 18:30 (UTC+5:30 offset subtracted).
 */
export function istDateToUtcMidnight(istDateStr: string): Date {
  // Parse the date parts to avoid any local-TZ interference
  const [year, month, day] = istDateStr.split('-').map(Number);
  // Construct as if UTC, then subtract IST offset to get the UTC instant that
  // corresponds to 00:00:00 IST on that date.
  const utcMs = Date.UTC(year, month - 1, day, 0, 0, 0) - IST_OFFSET_MS;
  return new Date(utcMs);
}

/**
 * Get the IST date string (YYYY-MM-DD) from a UTC DateTime stored as IST midnight.
 */
export function utcToIstDate(utcDate: Date): string {
  const istMs = utcDate.getTime() + IST_OFFSET_MS;
  const d = new Date(istMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Compute the UTC instant for a given IST date + hour (slot start).
 * E.g. slotDate=2024-03-15, slotHour=17 → 2024-03-15 11:30:00 UTC
 */
export function slotStartAtUtc(istDateStr: string, slotHour: number): Date {
  const midnight = istDateToUtcMidnight(istDateStr);
  return new Date(midnight.getTime() + slotHour * 60 * 60 * 1000);
}

/**
 * Current time in IST as a Date (useful for PAST-slot checks).
 */
export function nowIst(): Date {
  return new Date(Date.now() + IST_OFFSET_MS);
}

/**
 * Current IST date string YYYY-MM-DD.
 */
export function todayIst(): string {
  const d = nowIst();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
