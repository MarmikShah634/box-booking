'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface OccupancyChartProps {
  data: { date: string; rate: number }[]
}

export function OccupancyChart({ data }: OccupancyChartProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-card">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Occupancy Rate (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
            domain={[0, 100]}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Occupancy']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#059669"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
