'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { superAdminApi } from '@/lib/api'
import type { Venue, PaginatedResponse } from '@/types'
import { AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_BADGE: Record<Venue['status'], string> = {
  draft: 'bg-gray-800 text-gray-400 border-gray-700',
  pending_review: 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
  approved: 'bg-green-900/50 text-green-400 border-green-700',
  rejected: 'bg-red-900/50 text-red-400 border-red-700',
  suspended: 'bg-orange-900/50 text-orange-400 border-orange-700',
}

interface VenueRow extends Venue {
  ownerName?: string
  ownerEmail?: string
  boxCount?: number
  photoCount?: number
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<VenueRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending_review')

  const limit = 20

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    superAdminApi<PaginatedResponse<VenueRow>>(`/super-admin/venues?${params.toString()}`).then((res) => {
      if (res.ok) {
        setVenues(res.data.data)
        setTotal(res.data.total)
      } else {
        setError(res.error)
      }
      setLoading(false)
    })
  }, [page, search, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-white">Venue Moderation</h1>
        <p className="text-xs text-gray-400 mt-0.5">{total} venues matching current filter</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search venue name…"
              className="h-8 rounded-md border border-gray-700 bg-gray-900 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:border-red-500 focus:outline-none w-52"
            />
          </div>
          <button
            type="submit"
            className="h-8 rounded-md bg-red-700 px-3 text-xs font-medium text-white hover:bg-red-600"
          >
            Search
          </button>
          {(search || statusFilter !== 'pending_review') && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setStatusFilter('pending_review'); setPage(1) }}
              className="h-8 rounded-md border border-gray-700 px-3 text-xs text-gray-300 hover:bg-gray-800"
            >
              Reset
            </button>
          )}
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 focus:border-red-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-800">
        <table className="w-full text-xs">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium">Venue</th>
              <th className="px-3 py-2.5 text-left font-medium">Owner</th>
              <th className="px-3 py-2.5 text-left font-medium">City</th>
              <th className="px-3 py-2.5 text-left font-medium">Status</th>
              <th className="px-3 py-2.5 text-left font-medium">Photos</th>
              <th className="px-3 py-2.5 text-left font-medium">Submitted</th>
              <th className="px-3 py-2.5 text-right font-medium">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-red-800 border-t-red-500" />
                </td>
              </tr>
            ) : venues.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  No venues found
                </td>
              </tr>
            ) : (
              venues.map((venue) => (
                <tr key={venue.id} className="bg-gray-950 hover:bg-gray-900/50">
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-white">{venue.name}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{venue.slug}</div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-300">
                    {venue.ownerName ?? <span className="text-gray-600">—</span>}
                    {venue.ownerEmail && (
                      <div className="text-[10px] text-gray-500">{venue.ownerEmail}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-gray-300">{venue.city}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize ${STATUS_BADGE[venue.status]}`}
                    >
                      {venue.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-400">
                    {venue.photoCount ?? venue.photos.length}
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">
                    {new Date(venue.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/super-admin/venues/${venue.id}`}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Review →
                    </Link>
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
