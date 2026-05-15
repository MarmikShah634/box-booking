'use client'

import { useEffect, useState, useCallback } from 'react'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const POLL_INTERVAL_MS = 20_000

export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'HELD' | 'BLACKOUT' | 'PAST' | 'CLOSED'

export interface Slot {
  id: string
  startTime: string
  endTime: string
  label: string
  status: SlotStatus
  pricePaise: number
}

export function useSlotAvailability(boxId: string, date: string) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSlots = useCallback(async () => {
    if (!boxId || !date) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${BASE_URL}/api/v1/slots/availability?boxId=${encodeURIComponent(boxId)}&date=${encodeURIComponent(date)}`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error('Failed to load slots')
      const data = await res.json()
      setSlots(data.slots || data)
    } catch {
      setError('Failed to load slots')
    } finally {
      setLoading(false)
    }
  }, [boxId, date])

  useEffect(() => {
    fetchSlots()
    const interval = setInterval(fetchSlots, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchSlots])

  return { slots, loading, error, refetch: fetchSlots }
}
