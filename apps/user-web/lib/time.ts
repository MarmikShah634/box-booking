import { format, formatDistance, parseISO, startOfDay, addDays, isBefore, isAfter } from 'date-fns'

const IST_OFFSET = 5.5 * 60 * 60 * 1000 // +05:30 in ms

export function nowIST(): Date {
  return new Date(Date.now() + IST_OFFSET - new Date().getTimezoneOffset() * 60000)
}

export function toISTDate(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date
  return new Date(d.getTime() + IST_OFFSET - d.getTimezoneOffset() * 60000)
}

export function formatDate(date: Date | string, pattern = 'd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern)
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'h:mm a')
}

export function formatDatetime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'd MMM yyyy, h:mm a')
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistance(d, new Date(), { addSuffix: true })
}

export function dateToISOString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function getTodayIST(): Date {
  return startOfDay(nowIST())
}

export function getMinBookingDate(): Date {
  return startOfDay(nowIST())
}

export function getMaxBookingDate(): Date {
  return addDays(getMinBookingDate(), 30)
}

export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isBefore(d, new Date())
}

export function isFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isAfter(d, new Date())
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
