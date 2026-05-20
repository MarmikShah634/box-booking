'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Send, Pencil, Box } from 'lucide-react'
import { ownerApi } from '@/lib/api'
import type { Venue } from '@/types'
import { VenueStatusBadge } from '@/components/owner/venues/VenueStatusBadge'
import { VenuePhotoUploader } from '@/components/owner/venues/VenuePhotoUploader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

type Tab = 'details' | 'photos' | 'boxes'

export default function VenueDetailPage() {
  const { venueId } = useParams<{ venueId: string }>()
  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('details')
  const [submitDialog, setSubmitDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    ownerApi<Venue>(`/venues/${venueId}`).then((res) => {
      if (res.ok) setVenue(res.data)
      setLoading(false)
    })
  }, [venueId])

  const handleSubmitForReview = async () => {
    setSubmitting(true)
    const res = await ownerApi(`/venues/${venueId}/submit`, { method: 'POST' })
    if (res.ok && venue) {
      setVenue({ ...venue, status: 'pending_review' })
    }
    setSubmitting(false)
    setSubmitDialog(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    )
  }

  if (!venue) {
    return <div className="p-6 text-gray-500">Venue not found.</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/owner/venues" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{venue.name}</h1>
              <VenueStatusBadge status={venue.status} />
            </div>
            <p className="text-sm text-gray-500">{venue.city}, {venue.state}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/owner/venues/${venueId}/edit`}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
          <Link
            href={`/owner/venues/${venueId}/boxes`}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Box className="h-4 w-4" />
            Boxes
          </Link>
          {venue.status === 'draft' && (
            <button
              onClick={() => setSubmitDialog(true)}
              className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Send className="h-4 w-4" />
              Submit for Review
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-gray-200">
        {(['details', 'photos', 'boxes'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              tab === t
                ? 'border-b-2 border-emerald-600 text-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{venue.address}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Pincode</dt>
              <dd className="mt-1 text-sm text-gray-900">{venue.pincode}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{venue.description || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Amenities</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {venue.amenities.length > 0
                  ? venue.amenities.map((a) => (
                      <span key={a} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{a}</span>
                    ))
                  : <span className="text-sm text-gray-400">None listed</span>
                }
              </dd>
            </div>
          </dl>
        </div>
      )}

      {tab === 'photos' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <VenuePhotoUploader
            venueId={venueId}
            initialPhotos={venue.photos.map((p) => p.url)}
          />
        </div>
      )}

      {tab === 'boxes' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-sm text-gray-500">Manage boxes for this venue</p>
          <Link
            href={`/owner/venues/${venueId}/boxes`}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Go to Boxes
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={submitDialog}
        onClose={() => setSubmitDialog(false)}
        onConfirm={handleSubmitForReview}
        title="Submit for Review"
        description="Once submitted, our team will review your venue. You'll be notified of the outcome within 2–3 business days."
        confirmLabel="Submit"
        loading={submitting}
      />
    </div>
  )
}
