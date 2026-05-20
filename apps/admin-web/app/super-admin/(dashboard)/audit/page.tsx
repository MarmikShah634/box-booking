'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { superAdminApi } from '@/lib/api'
import type { AuditLog, PaginatedResponse } from '@/types'
import { AlertCircle, ChevronLeft, ChevronRight, X, Download } from 'lucide-react'

const ACTOR_TYPE_BADGE: Record<AuditLog['actorType'], string> = {
  owner: 'bg-blue-900/50 text-blue-400 border-blue-800',
  super_admin: 'bg-red-900/50 text-red-400 border-red-800',
  system: 'bg-gray-800 text-gray-400 border-gray-700',
}

function DetailDrawer({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg bg-gray-900 border-l border-gray-700 overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-3">
          <h3 className="text-sm font-semibold text-white">Audit Entry Detail</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-gray-500">Timestamp</dt>
              <dd className="text-white">{new Date(log.createdAt).toLocaleString('en-IN')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Actor Type</dt>
              <dd className="capitalize text-white">{log.actorType.replace('_', ' ')}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Actor</dt>
              <dd className="font-mono text-white text-[10px]">{log.actorId}</dd>
            </div>
            {log.actorEmail && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Actor Email</dt>
                <dd className="text-white">{log.actorEmail}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Action</dt>
              <dd className="font-mono text-red-400">{log.action}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Resource</dt>
              <dd className="text-white">{log.resourceType}:{log.resourceId.slice(0, 8)}…</dd>
            </div>
            {log.ipAddress && (
              <div className="flex justify-between">
                <dt className="text-gray-500">IP Address</dt>
                <dd className="font-mono text-white">{log.ipAddress}</dd>
              </div>
            )}
            {log.userAgent && (
              <div>
                <dt className="text-gray-500 mb-1">User Agent</dt>
                <dd className="text-gray-300 text-[10px] break-all">{log.userAgent}</dd>
              </div>
            )}
          </dl>
          {log.reason && (
            <div>
              <p className="mb-1 text-xs font-medium text-gray-400">Reason</p>
              <div className="rounded-md bg-gray-950 border border-gray-800 px-3 py-2 text-xs text-gray-300">
                {log.reason}
              </div>
            </div>
          )}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-gray-400">Metadata</p>
              <div className="rounded-md bg-gray-950 border border-gray-800 px-3 py-2 text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-64">
                {JSON.stringify(log.metadata, null, 2)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [actorTypeFilter, setActorTypeFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [resourceTypeFilter, setResourceTypeFilter] = useState('')

  const limit = 25

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (actorTypeFilter) params.set('actorType', actorTypeFilter)
    if (actionFilter) params.set('action', actionFilter)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    if (resourceTypeFilter) params.set('resourceType', resourceTypeFilter)
    superAdminApi<PaginatedResponse<AuditLog>>(`/super-admin/audit-log?${params}`).then((res) => {
      if (res.ok) {
        setLogs(res.data.data)
        setTotal(res.data.total)
      } else {
        setError(res.error)
      }
      setLoading(false)
    })
  }, [page, actorTypeFilter, actionFilter, dateFrom, dateTo, resourceTypeFilter])

  useEffect(() => {
    load()
  }, [load])

  const totalPages = Math.ceil(total / limit)

  const buildExportUrl = () => {
    const params = new URLSearchParams()
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    if (actorTypeFilter) params.set('actorType', actorTypeFilter)
    if (actionFilter) params.set('action', actionFilter)
    if (resourceTypeFilter) params.set('resourceType', resourceTypeFilter)
    return `/super-admin/audit/export?${params.toString()}`
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Audit Log</h1>
          <p className="text-xs text-gray-400 mt-0.5">{total} entries matching filters</p>
        </div>
        <Link
          href={buildExportUrl()}
          className="flex items-center gap-1.5 rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={actorTypeFilter}
          onChange={(e) => { setActorTypeFilter(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 focus:border-red-500 focus:outline-none"
        >
          <option value="">All Actors</option>
          <option value="super_admin">Super Admin</option>
          <option value="owner">Owner</option>
          <option value="system">System</option>
        </select>
        <input
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
          placeholder="Filter action…"
          className="h-8 rounded-md border border-gray-700 bg-gray-900 px-3 text-xs text-gray-300 placeholder-gray-500 focus:border-red-500 focus:outline-none w-40"
        />
        <input
          value={resourceTypeFilter}
          onChange={(e) => { setResourceTypeFilter(e.target.value); setPage(1) }}
          placeholder="Resource type…"
          className="h-8 rounded-md border border-gray-700 bg-gray-900 px-3 text-xs text-gray-300 placeholder-gray-500 focus:border-red-500 focus:outline-none w-36"
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 focus:border-red-500 focus:outline-none"
        />
        <span className="flex items-center text-xs text-gray-500">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-gray-700 bg-gray-900 px-2 text-xs text-gray-300 focus:border-red-500 focus:outline-none"
        />
        {(actorTypeFilter || actionFilter || resourceTypeFilter || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setActorTypeFilter('')
              setActionFilter('')
              setResourceTypeFilter('')
              setDateFrom('')
              setDateTo('')
              setPage(1)
            }}
            className="h-8 rounded-md border border-gray-700 px-3 text-xs text-gray-300 hover:bg-gray-800"
          >
            Clear
          </button>
        )}
      </div>

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
              <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">Timestamp</th>
              <th className="px-3 py-2.5 text-left font-medium">Actor</th>
              <th className="px-3 py-2.5 text-left font-medium">Action</th>
              <th className="px-3 py-2.5 text-left font-medium">Target</th>
              <th className="px-3 py-2.5 text-left font-medium">Reason</th>
              <th className="px-3 py-2.5 text-left font-medium">IP</th>
              <th className="px-3 py-2.5 text-right font-medium">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-red-800 border-t-red-500" />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  No audit entries found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="bg-gray-950 hover:bg-gray-900/50">
                  <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize ${ACTOR_TYPE_BADGE[log.actorType]}`}
                    >
                      {log.actorType.replace('_', ' ')}
                    </span>
                    {log.actorEmail && (
                      <div className="mt-0.5 text-[10px] text-gray-500 max-w-[120px] truncate">
                        {log.actorEmail}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-red-400">{log.action}</td>
                  <td className="px-3 py-2.5 text-gray-300">
                    <span className="capitalize">{log.resourceType}</span>
                    <span className="ml-1 font-mono text-[10px] text-gray-500">
                      :{log.resourceId.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 max-w-[200px] truncate">
                    {log.reason ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[10px] text-gray-500">
                    {log.ipAddress ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-700 disabled:opacity-40 hover:bg-gray-800"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="flex h-7 items-center px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-700 disabled:opacity-40 hover:bg-gray-800"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {selectedLog && (
        <DetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  )
}
