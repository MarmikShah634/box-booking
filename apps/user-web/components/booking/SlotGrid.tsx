'use client'

import { type Slot, type SlotStatus } from '@/hooks/useSlotAvailability'
import { paiseToRupees } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Lock, Ban, Clock } from 'lucide-react'

interface SlotGridProps {
  slots: Slot[]
  loading: boolean
  selected: Slot | null
  onSelect: (slot: Slot) => void
}

const STATUS_CONFIG: Record<SlotStatus, { label: string; selectable: boolean }> = {
  AVAILABLE: { label: 'Available', selectable: true },
  BOOKED: { label: 'Booked', selectable: false },
  HELD: { label: 'Held', selectable: false },
  BLACKOUT: { label: 'Closed', selectable: false },
  PAST: { label: 'Past', selectable: false },
  CLOSED: { label: 'Closed', selectable: false },
}

function SlotIcon({ status }: { status: SlotStatus }) {
  if (status === 'BOOKED') return <Lock className="w-3 h-3" aria-hidden="true" />
  if (status === 'HELD') return <Clock className="w-3 h-3" aria-hidden="true" />
  if (status === 'BLACKOUT' || status === 'CLOSED') return <Ban className="w-3 h-3" aria-hidden="true" />
  return null
}

export function SlotGrid({ slots, loading, selected, onSelect }: SlotGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" aria-busy="true" aria-label="Loading slots">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        <p className="text-sm">No slots available for this date.</p>
        <p className="text-xs mt-1">Try selecting a different date.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-zinc-500">
        {[
          { color: 'bg-emerald-100 border-emerald-300', label: 'Available' },
          { color: 'bg-zinc-100 border-zinc-300', label: 'Booked' },
          { color: 'bg-amber-50 border-amber-300', label: 'Held' },
          { color: 'bg-red-50 border-red-200', label: 'Closed' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={cn('w-3 h-3 rounded border', color)} />
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="listbox" aria-label="Available time slots">
        {slots.map((slot) => {
          const config = STATUS_CONFIG[slot.status]
          const isSelected = selected?.id === slot.id
          const isAvailable = slot.status === 'AVAILABLE'

          return (
            <button
              key={slot.id}
              role="option"
              aria-selected={isSelected}
              aria-label={`${slot.label}, ${paiseToRupees(slot.pricePaise)}, ${config.label}`}
              disabled={!config.selectable}
              onClick={() => config.selectable && onSelect(slot)}
              className={cn(
                'relative flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-150',
                'min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                isSelected && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 ring-2 ring-emerald-500',
                !isSelected && isAvailable && 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 active:scale-[0.98] cursor-pointer',
                slot.status === 'BOOKED' && 'border-zinc-200 bg-zinc-50 dark:bg-zinc-800/50 dark:border-zinc-700 cursor-not-allowed opacity-70',
                slot.status === 'HELD' && 'border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 cursor-not-allowed opacity-80',
                (slot.status === 'BLACKOUT' || slot.status === 'CLOSED' || slot.status === 'PAST') && 'border-zinc-200 bg-zinc-50/50 dark:bg-zinc-800/30 cursor-not-allowed opacity-50',
              )}
            >
              <span className={cn(
                'text-sm font-semibold',
                isSelected ? 'text-emerald-700 dark:text-emerald-400' : isAvailable ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400',
              )}>
                {slot.label}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                {isAvailable ? (
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {paiseToRupees(slot.pricePaise)}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <SlotIcon status={slot.status} />
                    {config.label}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
