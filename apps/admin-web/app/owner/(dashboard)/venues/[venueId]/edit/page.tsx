'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ownerApi } from '@/lib/api'
import type { Venue } from '@/types'
import { VenueForm, type VenueFormData } from '@/components/owner/venues/VenueForm'

export default function EditVenuePage() {
  const { venueId } = useParams<{ venueId: string }>()
  const router = useRouter()
  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ownerApi<Venue>(`/venues/${venueId}`).then((res) => {
      if (res.ok) setVenue(res.data)
      setLoading(false)
    })
  }, [venueId])

  const handleSubmit = async (data: VenueFormData) => {
    setError(null)
    const res = await ownerApi(`/venues/${venueId}`, { method: 'PATCH', body: data })
    if (!res.ok) { setError(res.error); return }
    router.push(`/owner/venues/${venueId}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/owner/venues/${venueId}`} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Venue</h1>
          <p className="text-sm text-gray-500">{venue?.name}</p>
        </div>
      </div>
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        {venue && (
          <VenueForm
            defaultValues={{
              name: venue.name,
              description: venue.description,
              address: venue.address,
              city: venue.city,
              state: venue.state,
              pincode: venue.pincode,
              amenities: venue.amenities,
            }}
            onSubmit={handleSubmit}
            error={error}
            submitLabel="Save Changes"
          />
        )}
      </div>
    </div>
  )
}
