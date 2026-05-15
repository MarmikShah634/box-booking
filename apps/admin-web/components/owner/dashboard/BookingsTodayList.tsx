import { formatRupees } from '@/lib/utils'
import type { Booking } from '@/types'
import { cn } from '@/lib/utils'

interface BookingsTodayListProps {
  bookings: Booking[]
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-gray-100 text-gray-600',
  completed: 'bg-blue-100 text-blue-700',
}

export function BookingsTodayList({ bookings }: BookingsTodayListProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-card">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-900">Today&apos;s Bookings</h3>
      </div>
      {bookings.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-gray-400">No bookings today</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {bookings.map((b) => (
            <li key={b.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{b.userName}</p>
                <p className="text-xs text-gray-500">
                  {b.boxName} · {b.startHour}:00–{b.endHour}:00 IST
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  {formatRupees(b.amountPaise)}
                </span>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusColors[b.status])}>
                  {b.status.replace('_', ' ')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
