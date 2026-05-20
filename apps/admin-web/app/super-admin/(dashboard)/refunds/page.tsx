'use client'

import { useEffect, useState, useCallback } from 'react'
import { superAdminApi } from '@/lib/api'
import { formatRupees } from '@/lib/utils'
import type { Refund, PaginatedResponse } from '@/types'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface RetryDialogProps {
  refund: Refund
  onConfirm: (reason: string) => Promise<void>
  onClose: () => void
}

function RetryRefundDialog({ refund, onConfirm, onClose }: RetryDialogProps) {
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
        <h3 className="text-sm font-semibold text-white">Retry Refund</h3>
        <p className="mt-1 text-xs text-gray-400">
          Retrying refund of <span className="font-semibold text-white">{formatRupees(refund.amountPaise)}</span> for booking{' '}
          <span className="font-mono text-gray-300">{refund.bookingId.slice(0, 8)}…</span>
        </p>
        <div className="mt-3 rounded-md border border-gray-800 bg-gray-950 px-3 py-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Amount</span>
            <span className="font-medium text-white">{formatRupees(refund.amountPaise)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-gray-500">Retry count</span>
            <span className="text-yellow-400">{refund.retryCount}</span>
          </div>
          {refund.reason && (
            <div className="mt-1 flex justify-between">
              <span className="text-gray-500">Original reason</span>
              <span className="text-gray-300 max-w-[200px] truncate">{refund.reason}</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-gray-300">
            Reason for retry <span className="text-red-400">*</span>
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
        <p className="mt-2 text-[10px] text-gray-500">
          Note: Manual mark-as-paid is not allowed. Refund must succeed via Razorpay API.
        </p>
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
            className="flex items-center gap-2 rounded-md bg-red-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Processing…' : 'Retry Refund'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ageLabel(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const diffH = Math.floor(diffMs / 3600000)
  const diffM = Math.floor(diffMs / 60000)
  if (diffH >= 24) return `${Math.floor(diffH / 24)}d ${diffH % 24}h`
  if (diffH >= 1) return `${diffH}h ${diffM % 60}m`
  return `${diffM}m`
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const limit = 25

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    superAdminApi<PaginatedResponse<Refund>>(`/super-admin/refunds?${params}`).then((res) => {
      if (res.ok) {
        setRefunds(res.data.data)
        setTotal(res.data.total)
      } else {
        setError(res.error)
      }
      setLoading(false)
    })
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  const handleRetry = async (refund: Refund, reason: string) => {
    const res = await superAdminApi<{ message?: string }>(
      `/super-admin/refunds/${refund.bookingId}/retry`,
      {
        method: 'POST',
        actionReason: reason,
        body: { reason },
      },
    )
    if (!res.ok) throw new Error(res.error)
    setActionSuccess(res.data.message ?? 'Refund retry enqueued')
    setSelectedRefund(null)
    load()
  }

  const totalPages = Math.ceil(total / limit)

  const STATUS_CLASS: Record<Refund['status'], string> = {
    pending: 'text-yellow-400',
    processing: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Refund Queue</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {total} pending/stuck refunds older than 1 hour
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {actionSuccess && (
        <div className="rounded-lg border border-green-800 bg-green-950/40 px-4 py-2 text-xs text-green-400">
          {actionSuccess}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-xs">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium">Booking ID</th>
              <th className="px-3 py-2.5 text-left font-medium">Amount</th>
              <th className="px-3 py-2.5 text-left font-medium">Status</th>
              <th className="px-3 py-2.5 text-left font-medium">Age</th>
              <th className="px-3 py-2.5 text-left font-medium">Retries</th>
              <th className="px-3 py-2.5 text-left font-medium">Razorpay Refund ID</th>
              <th className="px-3 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-red-800 border-t-red-500" />
                </td>
              </tr>
            ) : refunds.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-green-400">
                  No stuck refunds — queue is clear
                </td>
              </tr>
            ) : (
              refunds.map((refund) => (
                <tr key={refund.id} className="bg-gray-950 hover:bg-gray-900/50">
                  <td className="px-3 py-2.5 font-mono text-[10px] text-gray-400">
                    {refund.bookingId.slice(0, 8)}…
                  </td>
                  <td className="px-3 py-2.5 font-medium text-white">
                    {formatRupees(refund.amountPaise)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`capitalize font-medium ${STATUS_CLASS[refund.status]}`}>
                      {refund.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-300">
                    {ageLabel(refund.createdAt)}
                  </td>
                  <td className="px-3 py-2.5 text-gray-300">{refund.retryCount}</td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-gray-500">
                    {refund.razorpayRefundId ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => setSelectedRefund(refund)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs text-gray-400">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded border border-gray-700 px-2 py-1 disabled:opacity-40 hover:bg-gray-800"
          >
            Prev
          </button>
          <span>{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded border border-gray-700 px-2 py-1 disabled:opacity-40 hover:bg-gray-800"
          >
            Next
          </button>
        </div>
      )}

      {selectedRefund && (
        <RetryRefundDialog
          refund={selectedRefund}
          onClose={() => setSelectedRefund(null)}
          onConfirm={(reason) => handleRetry(selectedRefund, reason)}
        />
      )}
    </div>
  )
}
