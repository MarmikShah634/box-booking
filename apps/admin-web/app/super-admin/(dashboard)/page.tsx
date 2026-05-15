'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { superAdminApi } from '@/lib/api'
import { formatRupees } from '@/lib/utils'
import type { SuperAdminDashboard, AuditLog } from '@/types'
import {
  AlertCircle,
  Building2,
  Users,
  CalendarDays,
  RotateCcw,
  CreditCard,
  Clock,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react'

function KpiCard({
  label,
  value,
  sub,
  href,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  href?: string
  accent?: boolean
}) {
  const inner = (
    <div
      className={`rounded-lg border p-4 ${accent ? 'border-red-700 bg-red-950/40' : 'border-gray-800 bg-gray-900'}`}
    >
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? 'text-red-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  )
  if (href) {
    return (
      <Link href={href} className="block hover:opacity-80 transition-opacity">
        {inner}
      </Link>
    )
  }
  return inner
}

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState<SuperAdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    superAdminApi<SuperAdminDashboard>('/super-admin/dashboard').then((res) => {
      if (res.ok) setData(res.data)
      else setError(res.error)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-800 border-t-red-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error ?? 'Failed to load dashboard'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-white">Operations Dashboard</h1>
        <p className="text-xs text-gray-400 mt-0.5">Platform overview — all metrics are live</p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard
          label="Pending Moderation"
          value={data.pendingModerationCount}
          href="/super-admin/venues"
          accent={data.pendingModerationCount > 0}
        />
        <KpiCard label="Total Owners" value={data.totalOwners} href="/super-admin/owners" />
        <KpiCard label="Total Venues" value={data.totalVenues} href="/super-admin/venues" />
        <KpiCard label="Total Bookings" value={data.totalBookings} href="/super-admin/bookings" />
        <KpiCard
          label="Platform Revenue"
          value={formatRupees(data.totalRevenuePaise)}
          sub="all-time advance collected"
        />
        <KpiCard
          label="Pending Refunds"
          value={data.pendingRefundsCount}
          href="/super-admin/refunds"
          accent={data.pendingRefundsCount > 0}
        />
        <KpiCard
          label="Webhook Failures"
          value={data.webhookFailureCount}
          href="/super-admin/payments"
          accent={data.webhookFailureCount > 0}
        />
        <KpiCard label="Queue Depth" value={data.queueDepth} sub="total jobs across queues" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Owners', href: '/super-admin/owners', icon: Users },
          { label: 'Venues', href: '/super-admin/venues', icon: Building2 },
          { label: 'Bookings', href: '/super-admin/bookings', icon: CalendarDays },
          { label: 'Refunds', href: '/super-admin/refunds', icon: RotateCcw },
          { label: 'Payments', href: '/super-admin/payments', icon: CreditCard },
          { label: 'Users', href: '/super-admin/users', icon: Users },
          { label: 'Audit Log', href: '/super-admin/audit', icon: ShieldAlert },
          { label: 'Settings', href: '/super-admin/settings', icon: Clock },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2.5 text-sm text-gray-300 hover:border-red-800 hover:text-white transition-colors"
          >
            <item.icon className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span>{item.label}</span>
            <ArrowRight className="ml-auto h-3.5 w-3.5 text-gray-600" />
          </Link>
        ))}
      </div>

      {/* Recent audit logs */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-200">Recent Audit Actions</h2>
          <Link href="/super-admin/audit" className="text-xs text-red-400 hover:text-red-300">
            View all →
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-800">
          <table className="w-full text-xs">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Time</th>
                <th className="px-3 py-2 text-left font-medium">Action</th>
                <th className="px-3 py-2 text-left font-medium">Target</th>
                <th className="px-3 py-2 text-left font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.recentAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                    No recent actions
                  </td>
                </tr>
              ) : (
                data.recentAuditLogs.map((log: AuditLog) => (
                  <tr key={log.id} className="bg-gray-950 hover:bg-gray-900/50">
                    <td className="px-3 py-2 text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-2 font-mono text-red-400">{log.action}</td>
                    <td className="px-3 py-2 text-gray-300">
                      {log.resourceType}:{log.resourceId.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2 text-gray-400 max-w-xs truncate">
                      {log.reason ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
