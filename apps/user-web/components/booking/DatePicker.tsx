'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, isAfter, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  selected: Date | null
  onSelect: (date: Date) => void
  minDate?: Date
  maxDate?: Date
}

export function DatePicker({ selected, onSelect, minDate, maxDate }: DatePickerProps) {
  const today = startOfDay(new Date())
  const effectiveMin = minDate || today
  const effectiveMax = maxDate || addMonths(today, 1)

  const [viewMonth, setViewMonth] = useState<Date>(today)

  const days = useMemo(() => {
    const start = startOfMonth(viewMonth)
    const end = endOfMonth(viewMonth)
    return eachDayOfInterval({ start, end })
  }, [viewMonth])

  // Leading/trailing padding for grid alignment (Mon=0 .. Sun=6)
  const firstDayOfWeek = (startOfMonth(viewMonth).getDay() + 6) % 7 // Monday-first

  const canPrevMonth = !isBefore(startOfMonth(viewMonth), startOfMonth(addMonths(effectiveMin, 1)))
  const canNextMonth = !isAfter(startOfMonth(addMonths(viewMonth, 1)), startOfMonth(effectiveMax))

  return (
    <div className="select-none">
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          disabled={!canPrevMonth}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {format(viewMonth, 'MMMM yyyy')}
        </span>

        <button
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          disabled={!canNextMonth}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-2" role="row">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-zinc-400 py-1" role="columnheader" aria-label={d}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1" role="grid">
        {/* Leading blanks */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {days.map((day) => {
          const isSelected = selected ? isSameDay(day, selected) : false
          const isToday = isSameDay(day, today)
          const isDisabled = isBefore(day, effectiveMin) || isAfter(day, effectiveMax)

          return (
            <button
              key={day.toISOString()}
              onClick={() => !isDisabled && onSelect(day)}
              disabled={isDisabled}
              aria-label={format(day, 'EEEE, d MMMM yyyy')}
              aria-selected={isSelected}
              aria-disabled={isDisabled}
              role="gridcell"
              className={cn(
                'relative w-full aspect-square rounded-xl text-sm font-medium transition-all duration-150',
                'flex items-center justify-center min-h-[44px]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                isDisabled && 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed',
                !isDisabled && !isSelected && 'text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700',
                isSelected && 'bg-emerald-600 text-white shadow-sm',
                isToday && !isSelected && 'border border-emerald-400 text-emerald-700 dark:text-emerald-400',
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
