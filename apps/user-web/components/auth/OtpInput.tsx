'use client'

import { useRef, KeyboardEvent, ClipboardEvent } from 'react'
import { cn } from '@/lib/utils'

const OTP_LENGTH = 6

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export function OtpInput({ value, onChange, error, disabled }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(OTP_LENGTH, '').split('').slice(0, OTP_LENGTH)

  const focusAt = (index: number) => {
    inputRefs.current[index]?.focus()
  }

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return
    const newDigits = [...digits]
    newDigits[index] = char.slice(-1)
    const newValue = newDigits.join('').replace(/\s/g, '')
    onChange(newValue)
    if (char && index < OTP_LENGTH - 1) focusAt(index + 1)
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const newDigits = [...digits]
        newDigits[index] = ''
        onChange(newDigits.join(''))
      } else if (index > 0) {
        focusAt(index - 1)
        const newDigits = [...digits]
        newDigits[index - 1] = ''
        onChange(newDigits.join(''))
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusAt(index - 1)
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      focusAt(index + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    onChange(pasted)
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    focusAt(focusIndex)
  }

  return (
    <div>
      <div
        className="flex gap-2 sm:gap-3"
        role="group"
        aria-label="One-time password input"
        onPaste={handlePaste}
      >
        {Array.from({ length: OTP_LENGTH }).map((_, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[index] || ''}
            disabled={disabled}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={(e) => e.target.select()}
            aria-label={`Digit ${index + 1}`}
            className={cn(
              'w-full max-w-[52px] h-14 text-center text-xl font-bold rounded-xl border transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900',
              error ? 'border-red-400' : 'border-zinc-200 dark:border-zinc-700',
              digits[index] ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' : '',
            )}
          />
        ))}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
