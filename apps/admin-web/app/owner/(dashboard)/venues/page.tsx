'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'
import { ownerApi } from '@/lib/api'
import type { Venue } from '@/types'
import { VenueStatusBadge } from '@/components/owner/venues/VenueStatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ownerApi<{ data: Venue[] }>('/venues/mine').then((res) => {
      if (res.ok) setVenues(res.data.data)
      else setError(res.error)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Venues</h1>
          <p className="text-sm text-gray-500">Manage your cricket venues</p>
        </div>
        <Link
          href="/owner/venues/new"
          className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Venue
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : venues.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No venues yet"
          description="Add your first venue to start accepting bookings"
          action={
            <Link
              href="/owner/venues/new"
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add Venue
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <div key={venue.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-semibold text-gray-900">{venue.name}</h3>
                  <p className="mt-0.5 truncate text-sm text-gray-500">{venue.city}, {venue.state}</p>
                </div>
                <VenueStatusBadge status={venue.status} />
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-gray-400">{venue.address}</p>
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={`/owner/venues/${venue.id}`}
                  className="text-xs font-medium text-emerald-600 hover:underline"
                >
                  View details
                </Link>
                <Link
                  href={`/owner/venues/${venue.id}/boxes`}
                  className="text-xs font-medium text-gray-500 hover:underline"
                >
                  Boxes
                </Link>
                <Link
                  href={`/owner/venues/${venue.id}/edit`}
                  className="text-xs font-medium text-gray-500 hover:underline"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
