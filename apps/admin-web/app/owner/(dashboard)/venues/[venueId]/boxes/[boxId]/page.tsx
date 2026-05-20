'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Tag, Calendar } from 'lucide-react'
import { ownerApi } from '@/lib/api'
import type { Box as BoxType } from '@/types'
import { cn } from '@/lib/utils'

export default function BoxDetailPage() {
  const { venueId, boxId } = useParams<{ venueId: string; boxId: string }>()
  const [box, setBox] = useState<BoxType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ownerApi<BoxType>(`/boxes/${boxId}`).then((res) => {
      if (res.ok) setBox(res.data)
      setLoading(false)
    })
  }, [boxId])

  if (loading) {
    return <div className="flex min-h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" /></div>
  }

  if (!box) return <div className="p-6 text-gray-500">Box not found.</div>

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/owner/venues/${venueId}/boxes`} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{box.name}</h1>
          <p className="text-sm text-gray-500">{box.sportType} · Capacity: {box.capacity}</p>
        </div>
        <span className={cn('ml-auto rounded-full px-3 py-1 text-xs font-semibold', box.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
          {box.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/owner/venues/${venueId}/boxes/${boxId}/pricing`}
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
            <Tag className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Pricing Rules</h3>
            <p className="text-sm text-gray-500">{box.pricingRules.length} bands configured</p>
          </div>
        </Link>

        <Link
          href={`/owner/venues/${venueId}/boxes/${boxId}/blackouts`}
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-card hover:shadow-card-hover transition-shadow"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
            <Calendar className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Blackout Dates</h3>
            <p className="text-sm text-gray-500">Block specific dates</p>
          </div>
        </Link>
      </div>

      {box.amenities.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-card">
          <h3 className="mb-3 font-semibold text-gray-900">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {box.amenities.map((a) => (
              <span key={a} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{a}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
