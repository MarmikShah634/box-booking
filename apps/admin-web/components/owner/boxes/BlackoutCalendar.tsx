'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertCircle } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { ownerApi } from '@/lib/api'
import type { Blackout } from '@/types'
import { cn } from '@/lib/utils'

interface BlackoutCalendarProps {
  boxId: string
}

const IST_TZ = 'Asia/Kolkata'

export function BlackoutCalendar({ boxId }: BlackoutCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => toZonedTime(new Date(), IST_TZ))
  const [blackouts, setBlackouts] = useState<Blackout[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [newReason, setNewReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ownerApi<Blackout[]>(`/boxes/${boxId}/blackouts`).then((res) => {
      if (res.ok) setBlackouts(res.data)
      setLoading(false)
    })
  }, [boxId])

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startPad = getDay(days[0]!) // 0=Sun

  const isBlackout = (day: Date) =>
    blackouts.some((b) => b.date === format(day, 'yyyy-MM-dd'))

  const handleAdd = async () => {
    if (!newDate) { setError('Select a date'); return }
    setError(null)
    const res = await ownerApi<Blackout>(`/boxes/${boxId}/blackouts`, {
      method: 'POST',
      body: { date: newDate, reason: newReason, isFullDay: true },
    })
    if (res.ok) {
      setBlackouts((prev) => [...prev, res.data])
      setAdding(false)
      setNewDate('')
      setNewReason('')
    } else {
      setError(res.error)
    }
  }

  const handleRemove = async (id: string) => {
    const res = await ownerApi(`/blackouts/${id}`, { method: 'DELETE' })
    if (res.ok) setBlackouts((prev) => prev.filter((b) => b.id !== id))
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentMonth((m) => subMonths(m, 1))} className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-semibold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="p-1 hover:bg-gray-100 rounded">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="bg-gray-50 py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
        ))}
        {Array.from({ length: startPad }, (_, i) => (
          <div key={`pad-${i}`} className="bg-white py-3" />
        ))}
        {days.map((day) => {
          const blocked = isBlackout(day)
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'flex items-center justify-center py-3 text-sm cursor-pointer transition-colors',
                blocked ? 'bg-red-100 text-red-700 font-semibold' : 'bg-white text-gray-700 hover:bg-gray-50',
              )}
              onClick={() => {
                if (!blocked) {
                  setNewDate(format(day, 'yyyy-MM-dd'))
                  setAdding(true)
                }
              }}
            >
              {format(day, 'd')}
            </div>
          )
        })}
      </div>

      {/* Add blackout form */}
      {adding && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <h4 className="font-medium text-gray-900 text-sm">Block date: {newDate}</h4>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}
          <input
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Reason (optional)"
            className="h-9 w-full rounded-md border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Block This Day
            </button>
            <button
              onClick={() => { setAdding(false); setError(null) }}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Blackout list */}
      {blackouts.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-700">Blocked Dates</h4>
          <ul className="space-y-2">
            {blackouts.map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">{b.date}</span>
                  {b.reason && <span className="ml-2 text-xs text-gray-400">{b.reason}</span>}
                </div>
                <button
                  onClick={() => handleRemove(b.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-xs text-gray-400">Click a date on the calendar to block it. Red dates are already blocked.</div>
    </div>
  )
}
