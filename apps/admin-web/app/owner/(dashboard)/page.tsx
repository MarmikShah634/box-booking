'use client'

import { useEffect, useState } from 'react'
import { ownerApi } from '@/lib/api'
import type { OwnerDashboard } from '@/types'
import { StatTiles } from '@/components/owner/dashboard/StatTiles'
import { OccupancyChart } from '@/components/owner/dashboard/OccupancyChart'
import { RevenueChart } from '@/components/owner/dashboard/RevenueChart'
import { BookingsTodayList } from '@/components/owner/dashboard/BookingsTodayList'
import { AlertCircle } from 'lucide-react'

export default function OwnerDashboardPage() {
  const [dashboard, setDashboard] = useState<OwnerDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ownerApi<OwnerDashboard>('/owners/me/dashboard').then((res) => {
      if (res.ok) setDashboard(res.data)
      else setError(res.error)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error ?? 'Failed to load dashboard'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your venues and bookings</p>
      </div>

      <StatTiles
        totalRevenuePaise={dashboard.totalRevenuePaise}
        totalBookings={dashboard.totalBookings}
        occupancyRate={dashboard.occupancyRate}
        pendingReviews={dashboard.pendingReviews}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={dashboard.revenueChart} />
        <OccupancyChart data={dashboard.occupancyChart} />
      </div>

      <BookingsTodayList bookings={dashboard.todayBookings} />
    </div>
  )
}
