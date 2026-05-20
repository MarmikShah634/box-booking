import { format, parseISO } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export const IST_TZ = 'Asia/Kolkata'

/** Format a UTC ISO string as IST display string */
export function formatIST(isoString: string, fmt = 'dd MMM yyyy, hh:mm a'): string {
  const zoned = toZonedTime(parseISO(isoString), IST_TZ)
  return `${format(zoned, fmt)} IST`
}

/** Format date only */
export function formatDateIST(isoString: string): string {
  return formatIST(isoString, 'dd MMM yyyy')
}

/** Format time only */
export function formatTimeIST(isoString: string): string {
  return formatIST(isoString, 'hh:mm a')
}

/** Get current date in IST */
export function nowIST(): Date {
  return toZonedTime(new Date(), IST_TZ)
}

/** Convert a local date + time (treated as IST) to UTC Date */
export function istToUtc(date: Date): Date {
  return fromZonedTime(date, IST_TZ)
}

/** Format a Date as YYYY-MM-DD in IST */
export function toISTDateString(date: Date): string {
  const zoned = toZonedTime(date, IST_TZ)
  return format(zoned, 'yyyy-MM-dd')
}
