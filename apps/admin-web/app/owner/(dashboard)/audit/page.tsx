'use client'

import { useEffect, useState } from 'react'
import { ownerApi } from '@/lib/api'
import type { AuditLog } from '@/types'

const ACTION_COLORS: Record<string, string> = {
  'venue.created': 'bg-emerald-100 text-emerald-700',
  'venue.updated': 'bg-blue-100 text-blue-700',
  'venue.submitted': 'bg-amber-100 text-amber-700',
  'box.created': 'bg-emerald-100 text-emerald-700',
  'box.updated': 'bg-blue-100 text-blue-700',
  'booking.cancelled': 'bg-red-100 text-red-700',
  'kyc.submitted': 'bg-purple-100 text-purple-700',
  'razorpay.updated': 'bg-orange-100 text-orange-700',
  'bank.updated': 'bg-orange-100 text-orange-700',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    setLoading(true)
    ownerApi<{ data: AuditLog[]; hasMore: boolean }>(`/audit/mine?page=${page}&limit=20`).then((res) => {
      if (res.ok) {
        setLogs((prev) => (page === 1 ? res.data.data : [...prev, ...res.data.data]))
        setHasMore(res.data.hasMore)
      }
      setLoading(false)
    })
  }, [page])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-1">Your last 90 days of account activity.</p>
      </div>

      {loading && page === 1 ? (
        <div className="flex min-h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-gray-500">
          No audit events found.
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Resource</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {log.resourceType}:{log.resourceId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.ipAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && (
            <div className="px-4 py-3 border-t border-gray-100 text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
