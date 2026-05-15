'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { BlackoutCalendar } from '@/components/owner/boxes/BlackoutCalendar'

export default function BlackoutsPage() {
  const { venueId, boxId } = useParams<{ venueId: string; boxId: string }>()

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/owner/venues/${venueId}/boxes/${boxId}`} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Blackout Dates</h1>
          <p className="text-sm text-gray-500">Block dates when this box is unavailable</p>
        </div>
      </div>
      <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        <BlackoutCalendar boxId={boxId} />
      </div>
    </div>
  )
}
