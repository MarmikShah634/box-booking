const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

export function istDateToUtcMidnight(istDateStr: string): Date {
  // istDateStr: 'YYYY-MM-DD'
  const [year, month, day] = istDateStr.split('-').map(Number);
  // Midnight IST = prev day 18:30 UTC
  const utc = new Date(Date.UTC(year, month - 1, day) - IST_OFFSET_MS);
  return utc;
}

export function utcToIstDate(utcDate: Date): string {
  const istMs = utcDate.getTime() + IST_OFFSET_MS;
  const ist = new Date(istMs);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function utcToIstHour(utcDate: Date): number {
  const istMs = utcDate.getTime() + IST_OFFSET_MS;
  const ist = new Date(istMs);
  return ist.getUTCHours();
}

export function nowInIst(): Date {
  return new Date(Date.now() + IST_OFFSET_MS);
}

export function isDayWeekend(date: Date): boolean {
  const istMs = date.getTime() + IST_OFFSET_MS;
  const ist = new Date(istMs);
  const day = ist.getUTCDay(); // 0=Sun, 6=Sat
  return day === 0 || day === 6;
}

export function slotStartAtUtc(istDateStr: string, slotHour: number): Date {
  // slotDate midnight IST + slotHour hours
  const midnightIst = istDateToUtcMidnight(istDateStr);
  return new Date(midnightIst.getTime() + slotHour * 60 * 60 * 1000);
}
