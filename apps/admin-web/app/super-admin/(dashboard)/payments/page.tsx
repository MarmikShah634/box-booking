'use client'

import { useEffect, useState, useCallback } from 'react'
import { superAdminApi } from '@/lib/api'
import { formatRupees } from '@/lib/utils'
import type { PaginatedResponse } from '@/types'
import { AlertCircle, RefreshCw, X } from 'lucide-react'

interface FailedPayment {
  id: string
  razorpayOrderId?: string
  razorpayPaymentId?: string
  amountPaise: number
  bookingId: string
  venueName?: string
  ownerName?: string
  errorMessage?: string
  failedAt: string
  createdAt: string
}

interface WebhookEvent {
  id: string
  event: string
  status: 'processed' | 'failed' | 'retrying' | 'pending'
  errorMessage?: string
  retryCount: number
  lastAttemptAt?: string
  createdAt: string
  payload?: Record<string, unknown>
}

function WebhookDetailDrawer({
  event,
  onClose,
  onRetry,
}: {
  event: WebhookEvent
  onClose: () => void
  onRetry: (id: string) => Promise<void>
}) {
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)
  const [retrySuccess, setRetrySuccess] = useState(false)

  const handleRetry = async () => {
    setRetrying(true)
    setRetryError(null)
    try {
      await onRetry(event.id)
      setRetrySuccess(true)
    } catch (e) {
      setRetryError(e instanceof Error ? e.message : 'Retry failed')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg bg-gray-900 border-l border-gray-700 overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-3">
          <h3 className="text-sm font-semibold text-white">Webhook Event Detail</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div><dt className="text-gray-500">Event</dt><dd className="font-mono text-white">{event.event}</dd></div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd className={`capitalize ${
                event.status === 'processed' ? 'text-green-400' :
                event.status === 'failed' ? 'text-red-400' :
                event.status === 'retrying' ? 'text-yellow-400' : 'text-gray-400'
              }`}>{event.status}</dd>
            </div>
            <div><dt className="text-gray-500">Retry Count</dt><dd className="text-white">{event.retryCount}</dd></div>
            <div>
              <dt className="text-gray-500">Last Attempt</dt>
              <dd className="text-white">
                {event.lastAttemptAt ? new Date(event.lastAttemptAt).toLocaleString('en-IN') : '—'}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500">Received</dt>
              <dd className="text-white">{new Date(event.createdAt).toLocaleString('en-IN')}</dd>
            </div>
          </dl>
          {event.errorMessage && (
            <div>
              <p className="mb-1 text-xs font-medium text-gray-400">Error</p>
              <div className="rounded-md bg-red-950/40 border border-red-800 px-3 py-2 text-xs text-red-300 font-mono whitespace-pre-wrap">
                {event.errorMessage}
              </div>
            </div>
          )}
          {event.payload && (
            <div>
              <p className="mb-1 text-xs font-medium text-gray-400">Payload (redacted)</p>
              <div className="rounded-md bg-gray-950 border border-gray-800 px-3 py-2 text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-64">
                {JSON.stringify(event.payload, null, 2)}
              </div>
            </div>
          )}
          {retrySuccess ? (
            <div className="rounded-md border border-green-800 bg-green-950/40 px-3 py-2 text-xs text-green-400">
              Retry enqueued successfully
            </div>
          ) : (
            <div className="space-y-2">
              {retryError && (
                <p className="text-xs text-red-400">{retryError}</p>
              )}
              <button
                onClick={handleRetry}
                disabled={retrying || event.status === 'processed'}
                className="flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Retrying…' : 'Retry Webhook'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'failed' | 'webhooks'>('failed')
  const [failedPayments, setFailedPayments] = useState<FailedPayment[]>([])
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([])
  const [webhookTotal, setWebhookTotal] = useState(0)
  const [failedTotal, setFailedTotal] = useState(0)
  const [failedPage, setFailedPage] = useState(1)
  const [webhookPage, setWebhookPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [webhookStatusFilter, setWebhookStatusFilter] = useState('')
  const [webhookEventFilter, setWebhookEventFilter] = useState('')
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEvent | null>(null)

  const limit = 20

  const loadFailed = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(failedPage), limit: String(limit) })
    superAdminApi<PaginatedResponse<FailedPayment>>(`/super-admin/payments/failed?${params}`).then((res) => {
      if (res.ok) { setFailedPayments(res.data.data); setFailedTotal(res.data.total) }
      else setError(res.error)
      setLoading(false)
    })
  }, [failedPage])

  const loadWebhooks = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(webhookPage), limit: String(limit) })
    if (webhookStatusFilter) params.set('status', webhookStatusFilter)
    if (webhookEventFilter) params.set('event', webhookEventFilter)
    superAdminApi<PaginatedResponse<WebhookEvent>>(`/super-admin/webhook-events?${params}`).then((res) => {
      if (res.ok) { setWebhookEvents(res.data.data); setWebhookTotal(res.data.total) }
      else setError(res.error)
      setLoading(false)
    })
  }, [webhookPage, webhookStatusFilter, webhookEventFilter])

  useEffect(() => {
    if (activeTab === 'failed') loadFailed()
    else loadWebhooks()
  }, [activeTab, loadFailed, loadWebhooks])

  const handleWebhookRetry = async (eventId: string) => {
    const res = await superAdminApi<{ message?: string }>(`/super-admin/webhook-events/${eventId}/retry`, {
      method: 'POST',
      body: {},
    })
    if (!res.ok) throw new Error(res.error)
  }

  const failedTotalPages = Math.ceil(failedTotal / limit)
  const webhookTotalPages = Math.ceil(webhookTotal / limit)

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold text-white">Payments</h1>
        <p className="text-xs text-gray-400 mt-0.5">Failed payments and webhook event log</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {(['failed', 'webhooks'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-red-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab === 'failed' ? 'Failed Payments' : 'Webhook Events'}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {activeTab === 'failed' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">{failedTotal} failed payments in last 30 days</p>
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-xs">
              <thead className="bg-gray-900 text-gray-400">
                <tr>
                  <th className="px-3 py-2.5 text-left font-medium">Booking</th>
                  <th className="px-3 py-2.5 text-left font-medium">Venue</th>
                  <th className="px-3 py-2.5 text-left font-medium">Owner</th>
                  <th className="px-3 py-2.5 text-left font-medium">Amount</th>
                  <th className="px-3 py-2.5 text-left font-medium">Error</th>
                  <th className="px-3 py-2.5 text-left font-medium">Failed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr><td colSpan={6} className="px-3 py-8 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-red-800 border-t-red-500" />
                  </td></tr>
                ) : failedPayments.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500">No failed payments</td></tr>
                ) : failedPayments.map((p) => (
                  <tr key={p.id} className="bg-gray-950 hover:bg-gray-900/50">
                    <td className="px-3 py-2.5 font-mono text-[10px] text-gray-400">
                      {p.bookingId.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2.5 text-white">{p.venueName ?? '—'}</td>
                    <td className="px-3 py-2.5 text-gray-300">{p.ownerName ?? '—'}</td>
                    <td className="px-3 py-2.5 text-white font-medium">{formatRupees(p.amountPaise)}</td>
                    <td className="px-3 py-2.5 text-red-400 max-w-xs truncate">{p.errorMessage ?? '—'}</td>
                    <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">
                      {new Date(p.failedAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {failedTotalPages > 1 && (
            <div className="flex items-center justify-end gap-2 text-xs text-gray-400">
              <button
                onClick={() => setFailedPage((p) => Math.max(1, p - 1))}
                disabled={failedPage === 1}
                className="rounded border border-gray-700 px-2 py-1 disabled:opacity-40 hover:bg-gray-800"
              >
                Prev
              </button>
              <span>{failedPage} / {failedTotalPages}</span>
              <button
                onClick={() => setFailedPage((p) => Math.min(failedTotalPages, p + 1))}
                disabled={failedPage === failedTotalPages}
                className="rounded border border-gray-700 px-2 py-1 disabled:opacity-40 hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <select
              value={webhookStatusFilter}
              onChange={(e) => { setWebhookStatusFilter(e.target.value); setWebhookPage(1) }}
              className="h-8 rounded-md border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 focus:border-red-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="processed">Processed</option>
              <option value="failed">Failed</option>
              <option value="retrying">Retrying</option>
              <option value="pending">Pending</option>
            </select>
            <input
              value={webhookEventFilter}
              onChange={(e) => { setWebhookEventFilter(e.target.value); setWebhookPage(1) }}
              placeholder="Filter event type…"
              className="h-8 rounded-md border border-gray-700 bg-gray-900 px-3 text-xs text-gray-300 placeholder-gray-500 focus:border-red-500 focus:outline-none w-48"
            />
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-xs">
              <thead className="bg-gray-900 text-gray-400">
                <tr>
                  <th className="px-3 py-2.5 text-left font-medium">Event</th>
                  <th className="px-3 py-2.5 text-left font-medium">Status</th>
                  <th className="px-3 py-2.5 text-left font-medium">Retries</th>
                  <th className="px-3 py-2.5 text-left font-medium">Last Attempt</th>
                  <th className="px-3 py-2.5 text-left font-medium">Received</th>
                  <th className="px-3 py-2.5 text-right font-medium">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr><td colSpan={6} className="px-3 py-8 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-red-800 border-t-red-500" />
                  </td></tr>
                ) : webhookEvents.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500">No webhook events</td></tr>
                ) : webhookEvents.map((ev) => (
                  <tr key={ev.id} className="bg-gray-950 hover:bg-gray-900/50">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-white">{ev.event}</td>
                    <td className="px-3 py-2.5">
                      <span className={`capitalize text-[10px] font-medium ${
                        ev.status === 'processed' ? 'text-green-400' :
                        ev.status === 'failed' ? 'text-red-400' :
                        ev.status === 'retrying' ? 'text-yellow-400' : 'text-gray-400'
                      }`}>{ev.status}</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-300">{ev.retryCount}</td>
                    <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">
                      {ev.lastAttemptAt ? new Date(ev.lastAttemptAt).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">
                      {new Date(ev.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => setSelectedWebhook(ev)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {webhookTotalPages > 1 && (
            <div className="flex items-center justify-end gap-2 text-xs text-gray-400">
              <button
                onClick={() => setWebhookPage((p) => Math.max(1, p - 1))}
                disabled={webhookPage === 1}
                className="rounded border border-gray-700 px-2 py-1 disabled:opacity-40 hover:bg-gray-800"
              >
                Prev
              </button>
              <span>{webhookPage} / {webhookTotalPages}</span>
              <button
                onClick={() => setWebhookPage((p) => Math.min(webhookTotalPages, p + 1))}
                disabled={webhookPage === webhookTotalPages}
                className="rounded border border-gray-700 px-2 py-1 disabled:opacity-40 hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {selectedWebhook && (
        <WebhookDetailDrawer
          event={selectedWebhook}
          onClose={() => setSelectedWebhook(null)}
          onRetry={handleWebhookRetry}
        />
      )}
    </div>
  )
}
