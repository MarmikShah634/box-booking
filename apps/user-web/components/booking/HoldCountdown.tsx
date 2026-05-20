'use client'

import { useHoldCountdown } from '@/hooks/useHoldCountdown'
import { Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

export function HoldCountdown() {
  const { formatted, urgency, isExpired } = useHoldCountdown()

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
        <Timer className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
        <span className="text-sm font-medium text-red-700 dark:text-red-400">
          Your hold has expired. Please select a slot again.
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors',
        urgency === 'safe' && 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
        urgency === 'warning' && 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
        urgency === 'critical' && 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 animate-pulse-soft',
      )}
      role="timer"
      aria-live="polite"
      aria-label={`Slot hold expires in ${formatted}`}
    >
      <Timer
        className={cn(
          'w-4 h-4 shrink-0',
          urgency === 'safe' && 'text-emerald-600 dark:text-emerald-400',
          urgency === 'warning' && 'text-amber-600 dark:text-amber-400',
          urgency === 'critical' && 'text-red-600 dark:text-red-400',
        )}
        aria-hidden="true"
      />
      <div className="flex-1">
        <p
          className={cn(
            'text-sm font-medium',
            urgency === 'safe' && 'text-emerald-700 dark:text-emerald-400',
            urgency === 'warning' && 'text-amber-700 dark:text-amber-400',
            urgency === 'critical' && 'text-red-700 dark:text-red-400',
          )}
        >
          Slot held for{' '}
          <span className="font-bold tabular-nums text-base">{formatted}</span>
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Complete payment before the timer runs out.
        </p>
      </div>
    </div>
  )
}
