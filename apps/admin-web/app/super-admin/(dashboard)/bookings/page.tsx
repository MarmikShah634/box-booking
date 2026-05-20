'use client'

import { useEffect, useState, useCallback } from 'react'
import { superAdminApi } from '@/lib/api'
import { formatRupees } from '@/lib/utils'
import type { Booking, PaginatedResponse } from '@/types'
import { AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react'

interface BookingRow extends Booking {
  ownerName?: string
  ownerEmail?: string
}

const STATUS_BADGE: Record<Booking['status'], string> = {
  confirmed: 'bg-green-900/50 text-green-400 border-green-800',
  cancelled: 'bg-red-900/50 text-red-400 border-red-800',
  no_show: 'bg-gray-800 text-gray-400 border-gray-700',
  completed: 'bg-blue-900/50 text-blue-400 border-blue-800',
}

const PAYMENT_BADGE: Record<Booking['paymentStatus'], string> = {
  pending: 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
  paid: 'bg-green-900/50 text-green-400 border-green-800',
  refunded: 'bg-blue-900/50 text-blue-400 border-blue-800',
  failed: 'bg-red-900/50 text-red-400 border-red-800',
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const limit = 25

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (paymentFilter) params.set('paymentStatus', paymentFilter)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    superAdminApi<PaginatedResponse<BookingRow>>(`/super-admin/bookings?${params.toString()}`).then((res) => {
      if (res.ok) {
        setBookings(res.data.data)
        setTotal(res.data.total)
      } else {
        setError(res.error)
      }
      setLoading(false)
    })
  }, [page, search, statusFilter, paymentFilter, dateFrom, dateTo])

  useEffect(() => {
    load()
  }, [load])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setSearchInput('')
    setStatusFilter('')
    setPaymentFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const hasFilters = search || statusFilter || paymentFilter || dateFrom || dateTo
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-white">All Bookings</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {total} bookings — read-only view across all venues
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search booking ID, venue…"
              className="h-8 rounded-md border border-gray-700 bg-gray-900 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none w-52"
            />
          </div>
          <button
            type="submit"
            className="h-8 rounded-md bg-red-700 px-3 text-xs font-medium text-white hover:bg-red-600"
          >
            Search
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-8 rounded-md border border-gray-700 px-3 text-xs text-gray-300 hover:bg-gray-800"
            >
              Clear
            </button>
          )}
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 focus:border-red-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
          <option value="no_show">No Show</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 focus:border-red-500 focus:outline-none"
        >
          <option value="">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 focus:border-red-500 focus:outline-none"
        />
        <span className="flex items-center text-xs text-gray-500">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 focus:border-red-500 focus:outline-none"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-xs">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium">Booking ID</th>
              <th className="px-3 py-2.5 text-left font-medium">Venue / Box</th>
              <th className="px-3 py-2.5 text-left font-medium">Owner</th>
              <th className="px-3 py-2.5 text-left font-medium">User</th>
              <th className="px-3 py-2.5 text-left font-medium">Date & Time</th>
              <th className="px-3 py-2.5 text-left font-medium">Amount</th>
              <th className="px-3 py-2.5 text-left font-medium">Status</th>
              <th className="px-3 py-2.5 text-left font-medium">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-red-800 border-t-red-500" />
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  No bookings found
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr key={booking.id} className="bg-gray-950 hover:bg-gray-900/50">
                  <td className="px-3 py-2.5 font-mono text-[10px] text-gray-400">
                    {booking.id.slice(0, 8)}…
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-white">{booking.venueName}</div>
                    <div className="text-[10px] text-gray-500">{booking.boxName}</div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-300">
                    {booking.ownerName ?? <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-gray-300">{booking.userName}</td>
                  <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">
                    <div>{booking.date}</div>
                    <div className="text-[10px] text-gray-500">
                      {booking.startHour}:00–{booking.endHour}:00 ({booking.durationHours}h)
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-white whitespace-nowrap">
                    {formatRupees(booking.amountPaise)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize ${STATUS_BADGE[booking.status]}`}
                    >
                      {booking.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize ${PAYMENT_BADGE[booking.paymentStatus]}`}
                    >
                      {booking.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-700 disabled:opacity-40 hover:bg-gray-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="flex h-7 items-center px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-700 disabled:opacity-40 hover:bg-gray-800"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
