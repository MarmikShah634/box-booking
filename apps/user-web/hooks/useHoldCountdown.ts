'use client'

import { useEffect, useState } from 'react'
import { useHoldStore } from '@/store/holdStore'
import { formatCountdown } from '@/lib/time'

export function useHoldCountdown() {
  const { hold, secondsRemaining, clearHold } = useHoldStore()
  const [seconds, setSeconds] = useState(secondsRemaining())

  useEffect(() => {
    if (!hold) {
      setSeconds(0)
      return
    }

    setSeconds(secondsRemaining())
    const interval = setInterval(() => {
      const remaining = secondsRemaining()
      setSeconds(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        clearHold()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [hold, secondsRemaining, clearHold])

  const formatted = formatCountdown(seconds)
  const urgency: 'safe' | 'warning' | 'critical' =
    seconds > 180 ? 'safe' : seconds > 60 ? 'warning' : 'critical'

  return { seconds, formatted, urgency, isExpired: seconds <= 0 }
}
