'use client'

import { useState, useMemo } from 'react'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import type { Booking } from '@/types'
import { DataTable } from '@/components/shared/DataTable'
import { BookingFilters } from './BookingFilters'
import { MarkNoShowDialog } from './MarkNoShowDialog'
import { formatRupees } from '@/lib/utils'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-gray-100 text-gray-600',
}

const helper = createColumnHelper<Booking>()

interface BookingsTableProps {
  bookings: Booking[]
  onRefresh: () => void
}

export function BookingsTable({ bookings, onRefresh }: BookingsTableProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [noShowId, setNoShowId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch = !search || b.userName.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !status || b.status === status
      const matchFrom = !dateFrom || b.date >= dateFrom
      const matchTo = !dateTo || b.date <= dateTo
      return matchSearch && matchStatus && matchFrom && matchTo
    })
  }, [bookings, search, status, dateFrom, dateTo])

  const columns = [
    helper.accessor('id', {
      header: 'Booking ID',
      cell: (info) => (
        <Link href={`/owner/bookings/${info.getValue()}`} className="font-mono text-xs text-emerald-600 hover:underline">
          {info.getValue().slice(0, 8)}...
        </Link>
      ),
    }),
    helper.accessor('userName', { header: 'Customer' }),
    helper.accessor('boxName', { header: 'Box' }),
    helper.accessor('date', {
      header: 'Date',
      cell: (info) => <span className="text-sm">{info.getValue()}</span>,
    }),
    helper.accessor('startHour', {
      header: 'Slot',
      cell: (info) => `${info.getValue()}:00 – ${info.row.original.endHour}:00 IST`,
    }),
    helper.accessor('amountPaise', {
      header: 'Amount',
      cell: (info) => <span className="font-medium">{formatRupees(info.getValue())}</span>,
    }),
    helper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusColors[info.getValue()] ?? '')}>
          {info.getValue().replace('_', ' ')}
        </span>
      ),
    }),
    helper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/owner/bookings/${row.original.id}`}
            className="text-xs text-emerald-600 hover:underline"
          >
            View
          </Link>
          {row.original.status === 'confirmed' && (
            <button
              onClick={() => setNoShowId(row.original.id)}
              className="text-xs text-amber-600 hover:underline"
            >
              No-Show
            </button>
          )}
        </div>
      ),
    }),
  ]

  return (
    <div className="space-y-4">
      <BookingFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
      />
      <DataTable columns={columns as ColumnDef<Booking>[]} data={filtered} pageSize={15} />
      {noShowId && (
        <MarkNoShowDialog
          bookingId={noShowId}
          open={true}
          onClose={() => setNoShowId(null)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  )
}
