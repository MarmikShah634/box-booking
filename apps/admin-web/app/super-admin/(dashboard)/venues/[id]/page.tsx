'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { superAdminApi } from '@/lib/api'
import type { Venue, VenuePhoto } from '@/types'
import { AlertCircle, ArrowLeft, ExternalLink, Check } from 'lucide-react'

interface VenueDetail extends Venue {
  ownerName?: string
  ownerEmail?: string
  ownerPhone?: string
  ownerKycStatus?: string
  ownerRazorpayConnected?: boolean
  boxCount?: number
  statusHistory?: { status: string; changedAt: string; reason?: string }[]
}

const PRESET_REASONS = [
  'Photos unclear or insufficient',
  'Address invalid or not verifiable',
  'Pricing seems unrealistic for the area',
  'Boxes not properly named or described',
  'Missing KYC information',
  'Other',
]

const CHECKLIST_ITEMS = [
  'Photos are real venue photos (not stock)',
  'Address is geocodable (manual sanity check)',
  'Pricing seems realistic for the area',
  'Boxes are properly named',
  'Cancellation window understood by owner (KYC submitted)',
]

function ActionDialog({
  title,
  description,
  presets,
  onConfirm,
  onClose,
  confirmLabel,
  confirmClass,
}: {
  title: string
  description: string
  presets?: string[]
  onConfirm: (reason: string) => Promise<void>
  onClose: () => void
  confirmLabel: string
  confirmClass: string
}) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (reason.trim().length < 5) {
      setError('Reason must be at least 5 characters')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onConfirm(reason.trim())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-5">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 text-xs text-gray-400">{description}</p>
        {presets && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReason(p)}
                className={`rounded border px-2 py-1 text-[10px] transition-colors ${
                  reason === p
                    ? 'border-red-600 bg-red-950/50 text-red-400'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-gray-300">
            Reason <span className="text-red-400">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Enter reason (min 5 chars)…"
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none resize-none"
          />
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [venue, setVenue] = useState<VenueDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<'approve' | 'reject' | 'suspend' | 'reinstate' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [checklist, setChecklist] = useState<boolean[]>(new Array(CHECKLIST_ITEMS.length).fill(false))
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    superAdminApi<VenueDetail>(`/super-admin/venues/${id}`).then((res) => {
      if (res.ok) setVenue(res.data)
      else setError(res.error)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleAction = async (action: string, reason: string) => {
    setActionError(null)
    setActionSuccess(null)
    const res = await superAdminApi<{ message?: string }>(`/super-admin/venues/${id}/${action}`, {
      method: 'POST',
      actionReason: reason,
      body: { reason },
    })
    if (!res.ok) throw new Error(res.error)
    setActionSuccess(res.data.message ?? 'Action completed')
    setDialog(null)
    load()
  }

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-800 border-t-red-500" />
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div className="p-6">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-1 text-xs text-gray-400 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error ?? 'Venue not found'}
        </div>
      </div>
    )
  }

  const isPending = venue.status === 'pending_review'
  const isApproved = venue.status === 'approved'
  const isSuspended = venue.status === 'suspended'

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">{venue.name}</h1>
            <p className="text-xs text-gray-500 font-mono">{venue.slug}</p>
          </div>
          <span
            className={`capitalize rounded border px-2 py-0.5 text-xs font-medium ${
              isApproved ? 'border-green-800 bg-green-950/40 text-green-400' :
              isPending ? 'border-yellow-800 bg-yellow-950/40 text-yellow-400' :
              isSuspended ? 'border-orange-800 bg-orange-950/40 text-orange-400' :
              'border-red-800 bg-red-950/40 text-red-400'
            }`}
          >
            {venue.status.replace('_', ' ')}
          </span>
        </div>
        {isApproved && (
          <a
            href={`/venues/${venue.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View as user
          </a>
        )}
      </div>

      {actionSuccess && (
        <div className="rounded-lg border border-green-800 bg-green-950/40 px-4 py-2 text-xs text-green-400">
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/40 px-4 py-2 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5" /> {actionError}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Photos */}
          {venue.photos.length > 0 && (
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Photos ({venue.photos.length})
              </h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {venue.photos.map((photo: VenuePhoto) => (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo.url)}
                    className="group relative aspect-video overflow-hidden rounded-md border border-gray-700 hover:border-red-600 transition-colors"
                  >
                    <Image
                      src={photo.url}
                      alt="Venue photo"
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                    {photo.isPrimary && (
                      <span className="absolute left-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[9px] text-gray-300">
                        Primary
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Venue details */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Venue Info</h2>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div className="col-span-2">
                <dt className="text-gray-500">Description</dt>
                <dd className="text-white mt-0.5">{venue.description ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Address</dt>
                <dd className="text-white">{venue.address}</dd>
              </div>
              <div>
                <dt className="text-gray-500">City / State</dt>
                <dd className="text-white">{venue.city}, {venue.state} {venue.pincode}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Coordinates</dt>
                <dd className="text-white font-mono">
                  {venue.latitude ? `${venue.latitude.toFixed(4)}, ${venue.longitude?.toFixed(4)}` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Amenities</dt>
                <dd className="text-white">{venue.amenities.join(', ') || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Boxes</dt>
                <dd className="text-white">{venue.boxCount ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Submitted</dt>
                <dd className="text-white">{new Date(venue.createdAt).toLocaleDateString('en-IN')}</dd>
              </div>
            </dl>
          </div>

          {/* Owner info */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Owner</h2>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div><dt className="text-gray-500">Name</dt><dd className="text-white">{venue.ownerName ?? '—'}</dd></div>
              <div><dt className="text-gray-500">Email</dt><dd className="text-white">{venue.ownerEmail ?? '—'}</dd></div>
              <div><dt className="text-gray-500">Phone</dt><dd className="text-white">{venue.ownerPhone ?? '—'}</dd></div>
              <div>
                <dt className="text-gray-500">KYC</dt>
                <dd className={`capitalize ${venue.ownerKycStatus === 'verified' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {venue.ownerKycStatus ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Razorpay</dt>
                <dd className={venue.ownerRazorpayConnected ? 'text-green-400' : 'text-red-400'}>
                  {venue.ownerRazorpayConnected ? 'Connected' : 'Not connected'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Status history */}
          {venue.statusHistory && venue.statusHistory.length > 0 && (
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Status History</h2>
              <div className="space-y-2">
                {venue.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-red-600 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-white capitalize">{h.status.replace('_', ' ')}</span>
                      <span className="ml-2 text-gray-500">
                        {new Date(h.changedAt).toLocaleString('en-IN')}
                      </span>
                      {h.reason && <p className="text-gray-400 mt-0.5">{h.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: actions + checklist */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</h2>
            <div className="space-y-2">
              {isPending && (
                <>
                  <button
                    onClick={() => setDialog('approve')}
                    className="w-full rounded-md bg-green-800 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 text-left"
                  >
                    Approve Venue
                  </button>
                  <button
                    onClick={() => setDialog('reject')}
                    className="w-full rounded-md border border-red-700 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/60 text-left"
                  >
                    Reject Venue
                  </button>
                </>
              )}
              {isApproved && (
                <button
                  onClick={() => setDialog('suspend')}
                  className="w-full rounded-md border border-orange-700 bg-orange-950/30 px-3 py-2 text-xs font-semibold text-orange-400 hover:bg-orange-950/60 text-left"
                >
                  Suspend Venue
                </button>
              )}
              {isSuspended && (
                <button
                  onClick={() => setDialog('reinstate')}
                  className="w-full rounded-md bg-blue-800 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 text-left"
                >
                  Reinstate Venue
                </button>
              )}
              {!isPending && !isApproved && !isSuspended && (
                <button
                  onClick={() => setDialog('approve')}
                  className="w-full rounded-md bg-green-800 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 text-left"
                >
                  Approve Venue
                </button>
              )}
            </div>
          </div>

          {/* Quality checklist */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Quality Checklist
            </h2>
            <p className="mb-3 text-[10px] text-gray-500">UI aid only — not enforced by system</p>
            <div className="space-y-2">
              {CHECKLIST_ITEMS.map((item, i) => (
                <label key={i} className="flex cursor-pointer items-start gap-2.5">
                  <div
                    onClick={() => {
                      const next = [...checklist]
                      next[i] = !next[i]
                      setChecklist(next)
                    }}
                    className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border cursor-pointer ${
                      checklist[i]
                        ? 'border-green-600 bg-green-700'
                        : 'border-gray-600 bg-gray-800'
                    }`}
                  >
                    {checklist[i] && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <span className="text-[11px] text-gray-300">{item}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1">
              <div className="h-1.5 flex-1 rounded-full bg-gray-800">
                <div
                  className="h-1.5 rounded-full bg-green-600 transition-all"
                  style={{ width: `${(checklist.filter(Boolean).length / CHECKLIST_ITEMS.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500">
                {checklist.filter(Boolean).length}/{CHECKLIST_ITEMS.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Photo lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-h-[90vh] max-w-4xl">
            <Image
              src={selectedPhoto}
              alt="Venue photo full size"
              width={1200}
              height={800}
              className="object-contain max-h-[90vh] rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Dialogs */}
      {dialog === 'approve' && (
        <ActionDialog
          title="Approve Venue"
          description="Venue will immediately appear in public listings."
          onClose={() => setDialog(null)}
          onConfirm={(reason) => handleAction('approve', reason)}
          confirmLabel="Approve"
          confirmClass="bg-green-700 hover:bg-green-600"
        />
      )}
      {dialog === 'reject' && (
        <ActionDialog
          title="Reject Venue"
          description="Owner will be notified with the reason. They can fix issues and resubmit."
          presets={PRESET_REASONS}
          onClose={() => setDialog(null)}
          onConfirm={(reason) => handleAction('reject', reason)}
          confirmLabel="Reject"
          confirmClass="bg-red-700 hover:bg-red-600"
        />
      )}
      {dialog === 'suspend' && (
        <ActionDialog
          title="Suspend Venue"
          description="Warning: All future bookings will be cancelled with full refunds. This action will cascade."
          onClose={() => setDialog(null)}
          onConfirm={(reason) => handleAction('suspend', reason)}
          confirmLabel="Suspend"
          confirmClass="bg-orange-700 hover:bg-orange-600"
        />
      )}
      {dialog === 'reinstate' && (
        <ActionDialog
          title="Reinstate Venue"
          description="The venue will be restored to approved status and appear in listings again."
          onClose={() => setDialog(null)}
          onConfirm={(reason) => handleAction('reinstate', reason)}
          confirmLabel="Reinstate"
          confirmClass="bg-blue-700 hover:bg-blue-600"
        />
      )}
    </div>
  )
}
