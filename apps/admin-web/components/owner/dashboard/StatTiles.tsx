'use client'

import { TrendingUp, CalendarDays, Users, Star } from 'lucide-react'
import { formatRupees } from '@/lib/utils'

interface StatTilesProps {
  totalRevenuePaise: number
  totalBookings: number
  occupancyRate: number
  pendingReviews: number
}

export function StatTiles({ totalRevenuePaise, totalBookings, occupancyRate, pendingReviews }: StatTilesProps) {
  const tiles = [
    {
      label: 'Total Revenue',
      value: formatRupees(totalRevenuePaise),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total Bookings',
      value: totalBookings.toLocaleString(),
      icon: CalendarDays,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Occupancy Rate',
      value: `${occupancyRate.toFixed(1)}%`,
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Pending Reviews',
      value: pendingReviews.toString(),
      icon: Star,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{tile.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{tile.value}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tile.bg}`}>
              <tile.icon className={`h-5 w-5 ${tile.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
