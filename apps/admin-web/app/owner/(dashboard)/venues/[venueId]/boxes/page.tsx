'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plus, Box } from 'lucide-react'
import { ownerApi } from '@/lib/api'
import type { Box as BoxType } from '@/types'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'

export default function VenueBoxesPage() {
  const { venueId } = useParams<{ venueId: string }>()
  const [boxes, setBoxes] = useState<BoxType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ownerApi<{ data: BoxType[] }>(`/venues/${venueId}/boxes`).then((res) => {
      if (res.ok) setBoxes(res.data.data)
      setLoading(false)
    })
  }, [venueId])

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/owner/venues/${venueId}`} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Boxes</h1>
            <p className="text-sm text-gray-500">Manage pitches for this venue</p>
          </div>
        </div>
        <Link
          href={`/owner/venues/${venueId}/boxes/new`}
          className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Box
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        </div>
      ) : boxes.length === 0 ? (
        <EmptyState
          icon={Box}
          title="No boxes yet"
          description="Add your first box/pitch to this venue"
          action={
            <Link
              href={`/owner/venues/${venueId}/boxes/new`}
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add Box
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boxes.map((box) => (
            <div key={box.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{box.name}</h3>
                  <p className="text-sm text-gray-500">{box.sportType} · {box.capacity} players</p>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', box.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                  {box.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Link href={`/owner/venues/${venueId}/boxes/${box.id}`} className="text-xs font-medium text-emerald-600 hover:underline">View</Link>
                <Link href={`/owner/venues/${venueId}/boxes/${box.id}/pricing`} className="text-xs font-medium text-gray-500 hover:underline">Pricing</Link>
                <Link href={`/owner/venues/${venueId}/boxes/${box.id}/blackouts`} className="text-xs font-medium text-gray-500 hover:underline">Blackouts</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
