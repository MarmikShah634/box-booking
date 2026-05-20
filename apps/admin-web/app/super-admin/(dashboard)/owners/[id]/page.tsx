'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { superAdminApi } from '@/lib/api'
import { formatRupees } from '@/lib/utils'
import type { Owner, Venue, Booking } from '@/types'
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react'

interface OwnerDetail extends Owner {
  venues?: Venue[]
  recentBookings?: Booking[]
  kycPan?: string
  kycGstin?: string
  kycBankLast4?: string
  subscriptionOverrideUntil?: string
  isSuspended?: boolean
  phone?: string
}

interface ActionDialogState {
  type: 'grant-free' | 'suspend' | 'reset-password' | 'revoke-free' | null
  loading: boolean
  reason: string
  error: string | null
  grantUntil?: string
}

function ReasonDialog({
  title,
  description,
  onConfirm,
  onClose,
  showDateInput,
}: {
  title: string
  description: string
  onConfirm: (reason: string, until?: string) => Promise<void>
  onClose: () => void
  showDateInput?: boolean
}) {
  const [reason, setReason] = useState('')
  const [until, setUntil] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (reason.trim().length < 5) {
      setError('Reason must be at least 5 characters')
      return
    }
    if (showDateInput && !until) {
      setError('Please select an expiry date')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onConfirm(reason.trim(), until || undefined)
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
        {showDateInput && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-gray-300">Free until</label>
            <input
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="h-9 w-full rounded-md border border-gray-700 bg-gray-800 px-3 text-sm text-white focus:border-red-500 focus:outline-none"
            />
          </div>
        )}
        <div className="mt-4">
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
            className="rounded-md bg-red-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OwnerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [owner, setOwner] = useState<OwnerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<ActionDialogState['type']>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [kycRevealed, setKycRevealed] = useState(false)
  const [bookingsExpanded, setBookingsExpanded] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    superAdminApi<OwnerDetail>(`/super-admin/owners/${id}`).then((res) => {
      if (res.ok) setOwner(res.data)
      else setError(res.error)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleAction = async (
    endpoint: string,
    reason: string,
    body?: Record<string, string>,
  ) => {
    setActionError(null)
    setActionSuccess(null)
    const res = await superAdminApi<{ message?: string }>(`/super-admin/owners/${id}/${endpoint}`, {
      method: 'POST',
      actionReason: reason,
      body: body ?? {},
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

  if (error || !owner) {
    return (
      <div className="p-6">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-1 text-xs text-gray-400 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error ?? 'Owner not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <h1 className="text-lg font-bold text-white">{owner.name}</h1>
        {owner.isSuspended && (
          <span className="rounded border border-red-700 bg-red-950/40 px-2 py-0.5 text-xs text-red-400">
            SUSPENDED
          </span>
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

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main info */}
        <div className="space-y-4 lg:col-span-2">
          {/* Profile */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Profile</h2>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div><dt className="text-gray-500">Name</dt><dd className="text-white font-medium">{owner.name}</dd></div>
              <div><dt className="text-gray-500">Email</dt><dd className="text-white">{owner.email}</dd></div>
              <div><dt className="text-gray-500">Phone</dt><dd className="text-white">{owner.phone ?? '—'}</dd></div>
              <div><dt className="text-gray-500">Joined</dt><dd className="text-white">{new Date(owner.createdAt).toLocaleDateString('en-IN')}</dd></div>
              <div><dt className="text-gray-500">KYC Status</dt><dd className="text-white capitalize">{owner.kycStatus}</dd></div>
              <div><dt className="text-gray-500">Razorpay</dt><dd className={owner.razorpayConnected ? 'text-green-400' : 'text-gray-500'}>{owner.razorpayConnected ? 'Connected' : 'Not connected'}</dd></div>
            </dl>
          </div>

          {/* Subscription */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Subscription</h2>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div><dt className="text-gray-500">Plan</dt><dd className="text-white capitalize">{owner.subscriptionPlan}</dd></div>
              <div>
                <dt className="text-gray-500">Expires</dt>
                <dd className="text-white">
                  {owner.subscriptionExpiresAt
                    ? new Date(owner.subscriptionExpiresAt).toLocaleDateString('en-IN')
                    : '—'}
                </dd>
              </div>
              {owner.subscriptionOverrideUntil && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Free Override Until</dt>
                  <dd className="text-green-400">
                    {new Date(owner.subscriptionOverrideUntil).toLocaleDateString('en-IN')}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* KYC */}
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">KYC Details</h2>
              <button
                onClick={() => setKycRevealed(!kycRevealed)}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
              >
                {kycRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {kycRevealed ? 'Hide' : 'Reveal'} (audit-logged)
              </button>
            </div>
            {kycRevealed ? (
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div><dt className="text-gray-500">PAN</dt><dd className="font-mono text-white">{owner.kycPan ?? '—'}</dd></div>
                <div><dt className="text-gray-500">GSTIN</dt><dd className="font-mono text-white">{owner.kycGstin ?? '—'}</dd></div>
                <div><dt className="text-gray-500">Bank (last 4)</dt><dd className="font-mono text-white">{owner.kycBankLast4 ? `****${owner.kycBankLast4}` : '—'}</dd></div>
              </dl>
            ) : (
              <p className="text-xs text-gray-500">Click reveal to view KYC data. This action will be recorded.</p>
            )}
          </div>

          {/* Venues */}
          {owner.venues && owner.venues.length > 0 && (
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Venues ({owner.venues.length})
              </h2>
              <div className="space-y-1.5">
                {owner.venues.map((venue) => (
                  <div key={venue.id} className="flex items-center justify-between rounded-md bg-gray-950 px-3 py-2 text-xs">
                    <div>
                      <span className="font-medium text-white">{venue.name}</span>
                      <span className="ml-2 text-gray-500">{venue.city}</span>
                    </div>
                    <span className={`capitalize rounded border px-1.5 py-0.5 text-[10px] ${
                      venue.status === 'approved' ? 'border-green-800 text-green-400' :
                      venue.status === 'pending_review' ? 'border-yellow-800 text-yellow-400' :
                      venue.status === 'suspended' ? 'border-red-800 text-red-400' :
                      'border-gray-700 text-gray-400'
                    }`}>
                      {venue.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent bookings */}
          {owner.recentBookings && owner.recentBookings.length > 0 && (
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <button
                onClick={() => setBookingsExpanded(!bookingsExpanded)}
                className="flex w-full items-center justify-between"
              >
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Recent Bookings ({owner.recentBookings.length})
                </h2>
                {bookingsExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
              {bookingsExpanded && (
                <div className="mt-3 space-y-1.5">
                  {owner.recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between rounded-md bg-gray-950 px-3 py-2 text-xs">
                      <div>
                        <span className="text-white">{booking.venueName}</span>
                        <span className="ml-2 text-gray-500">{booking.date}</span>
                      </div>
                      <span className="text-gray-300">{formatRupees(booking.amountPaise)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions sidebar */}
        <div className="space-y-3">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => setDialog('grant-free')}
                className="w-full rounded-md bg-gray-800 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 text-left"
              >
                Grant Free Subscription
              </button>
              {owner.subscriptionOverrideUntil && (
                <button
                  onClick={() => setDialog('revoke-free')}
                  className="w-full rounded-md border border-red-800 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40 text-left"
                >
                  Revoke Free Override
                </button>
              )}
              <button
                onClick={() => setDialog('reset-password')}
                className="w-full rounded-md bg-gray-800 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 text-left"
              >
                Send Password Reset Email
              </button>
              {!owner.isSuspended ? (
                <button
                  onClick={() => setDialog('suspend')}
                  className="w-full rounded-md border border-red-700 bg-red-950/30 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-950/60 text-left"
                >
                  Suspend Owner
                </button>
              ) : (
                <button
                  onClick={async () => {
                    const reason = window.prompt('Reason for reinstating owner?')
                    if (!reason || reason.length < 5) return
                    const res = await superAdminApi<{ message?: string }>(`/super-admin/owners/${id}/reinstate`, {
                      method: 'POST',
                      actionReason: reason,
                      body: {},
                    })
                    if (res.ok) { setActionSuccess('Owner reinstated'); load() }
                    else setActionError(res.error)
                  }}
                  className="w-full rounded-md border border-green-800 bg-green-950/30 px-3 py-2 text-xs font-medium text-green-400 hover:bg-green-950/60 text-left"
                >
                  Reinstate Owner
                </button>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Owner ID</h2>
            <p className="font-mono text-[10px] text-gray-500 break-all">{owner.id}</p>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {dialog === 'grant-free' && (
        <ReasonDialog
          title="Grant Free Subscription"
          description="This owner will bypass subscription requirements until the specified date."
          showDateInput
          onClose={() => setDialog(null)}
          onConfirm={async (reason, until) => {
            await handleAction('grant-free', reason, { overrideUntil: until ?? '' })
          }}
        />
      )}
      {dialog === 'revoke-free' && (
        <ReasonDialog
          title="Revoke Free Override"
          description="The owner's free subscription override will be removed immediately."
          onClose={() => setDialog(null)}
          onConfirm={async (reason) => {
            await handleAction('revoke-free', reason)
          }}
        />
      )}
      {dialog === 'suspend' && (
        <ReasonDialog
          title="Suspend Owner"
          description="Warning: All owner venues will be suspended and future bookings will be cancelled with full refunds."
          onClose={() => setDialog(null)}
          onConfirm={async (reason) => {
            await handleAction('suspend', reason)
          }}
        />
      )}
      {dialog === 'reset-password' && (
        <ReasonDialog
          title="Send Password Reset"
          description="A password reset link will be sent to the owner's email address."
          onClose={() => setDialog(null)}
          onConfirm={async (reason) => {
            await handleAction('reset-password', reason)
          }}
        />
      )}
    </div>
  )
}
