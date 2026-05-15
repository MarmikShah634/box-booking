'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ownerApi } from '@/lib/api'
import type { Booking } from '@/types'
import { formatRupees } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { MarkNoShowDialog } from '@/components/owner/bookings/MarkNoShowDialog'

const statusColors: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-gray-100 text-gray-600',
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [noShowOpen, setNoShowOpen] = useState(false)

  const load = () => {
    ownerApi<Booking>(`/bookings/${id}`).then((res) => {
      if (res.ok) setBooking(res.data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [id])

  if (loading) return <div className="flex min-h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" /></div>
  if (!booking) return <div className="p-6 text-gray-500">Booking not found.</div>

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/owner/bookings" className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Booking #{booking.id.slice(0, 8)}</h1>
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[booking.status] ?? '')}>
            {booking.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
          <h3 className="mb-3 font-semibold text-gray-900">Customer</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Name</dt>
              <dd className="font-medium text-gray-900">{booking.userName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Phone</dt>
              <dd className="font-medium text-gray-900">{booking.userPhone}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
          <h3 className="mb-3 font-semibold text-gray-900">Booking Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Venue</dt>
              <dd className="font-medium text-gray-900">{booking.venueName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Box</dt>
              <dd className="font-medium text-gray-900">{booking.boxName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Date</dt>
              <dd className="font-medium text-gray-900">{booking.date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Slot</dt>
              <dd className="font-medium text-gray-900">{booking.startHour}:00 – {booking.endHour}:00 IST</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Amount</dt>
              <dd className="font-bold text-gray-900">{formatRupees(booking.amountPaise)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {booking.status === 'confirmed' && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setNoShowOpen(true)}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Mark as No-Show
          </button>
        </div>
      )}

      <MarkNoShowDialog
        bookingId={booking.id}
        open={noShowOpen}
        onClose={() => setNoShowOpen(false)}
        onSuccess={load}
      />
    </div>
  )
}
