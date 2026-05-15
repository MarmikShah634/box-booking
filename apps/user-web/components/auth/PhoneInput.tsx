'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'maxLength'> {
  error?: string
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div>
        <div className={cn(
          'flex items-center rounded-xl border transition-colors overflow-hidden',
          'focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-1',
          error ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700',
          'bg-white dark:bg-zinc-900',
        )}>
          {/* Country prefix */}
          <div className="flex items-center gap-1.5 px-3 py-2.5 border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 shrink-0">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">+91</span>
          </div>

          {/* Number input */}
          <input
            ref={ref}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            placeholder="98765 43210"
            className={cn(
              'flex-1 h-11 bg-transparent px-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400',
              'focus-visible:outline-none',
              className,
            )}
            {...props}
          />
        </div>

        {error && (
          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  },
)

PhoneInput.displayName = 'PhoneInput'
