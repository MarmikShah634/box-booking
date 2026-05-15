import Link from 'next/link'
import { CalendarDays, MapPin, Clock, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/time'
import { paiseToRupees } from '@/lib/currency'
import { Badge } from '@/components/ui/badge'

export interface Booking {
  id: string
  venueName: string
  venueCity: string
  boxName: string
  date: string
  startTime: string
  endTime: string
  slotLabel: string
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  totalPaise: number
  advancePaidPaise: number
  balancePaise: number
}

const STATUS_LABELS: Record<Booking['status'], string> = {
  CONFIRMED: 'Confirmed',
  PENDING: 'Pending',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
  NO_SHOW: 'No show',
}

const STATUS_VARIANTS: Record<Booking['status'], 'success' | 'warning' | 'destructive' | 'secondary' | 'default'> = {
  CONFIRMED: 'success',
  PENDING: 'warning',
  CANCELLED: 'destructive',
  COMPLETED: 'secondary',
  NO_SHOW: 'secondary',
}

export function BookingCard({ booking }: { booking: Booking }) {
  return (
    <Link
      href={`/me/bookings/${booking.id}`}
      className="group block rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 hover:shadow-card-hover transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
            {booking.venueName}
          </h3>
          <div className="flex items-center gap-1 mt-0.5 text-zinc-500 dark:text-zinc-400">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="text-sm truncate">{booking.venueCity} &bull; {booking.boxName}</span>
          </div>
        </div>
        <Badge variant={STATUS_VARIANTS[booking.status]} className="shrink-0">
          {STATUS_LABELS[booking.status]}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
          {formatDate(booking.date, 'EEE, d MMM yyyy')}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          {booking.slotLabel}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-700">
        <div className="flex gap-4">
          <div>
            <p className="text-xs text-zinc-400">Total</p>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {paiseToRupees(booking.totalPaise)}
            </p>
          </div>
          {booking.balancePaise > 0 && (
            <div>
              <p className="text-xs text-zinc-400">Balance due</p>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {paiseToRupees(booking.balancePaise)}
              </p>
            </div>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-600 transition-colors" />
      </div>
    </Link>
  )
}
