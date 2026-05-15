'use client'

import { useEffect, useState, useCallback } from 'react'
import { ownerApi } from '@/lib/api'
import type { Booking } from '@/types'
import { BookingsTable } from '@/components/owner/bookings/BookingsTable'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    ownerApi<{ data: Booking[] }>('/owners/me/bookings').then((res) => {
      if (res.ok) setBookings(res.data.data)
      else setError(res.error)
      setLoading(false)
    })
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500">All bookings across your venues</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : (
        <BookingsTable bookings={bookings} onRefresh={load} />
      )}
    </div>
  )
}
