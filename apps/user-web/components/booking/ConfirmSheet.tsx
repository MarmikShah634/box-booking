'use client'

import { useState } from 'react'
import { CalendarDays, MapPin, Clock, AlertTriangle } from 'lucide-react'
import { useHoldStore } from '@/store/holdStore'
import { HoldCountdown } from './HoldCountdown'
import { PriceBreakdown } from './PriceBreakdown'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { paiseToRupees } from '@/lib/currency'
import { formatDate } from '@/lib/time'
import Link from 'next/link'

interface ConfirmSheetProps {
  onPay: () => Promise<void>
  paying: boolean
}

export function ConfirmSheet({ onPay, paying }: ConfirmSheetProps) {
  const { hold } = useHoldStore()
  const [termsAccepted, setTermsAccepted] = useState(false)

  if (!hold) return null

  return (
    <div className="space-y-5">
      {/* Hold countdown */}
      <HoldCountdown />

      {/* Booking summary */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Booking summary</h3>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{hold.venueName}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{hold.venueAddress}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CalendarDays className="w-4 h-4 text-zinc-400 shrink-0" />
            <p className="text-sm text-zinc-700 dark:text-zinc-300">{formatDate(hold.date, 'EEEE, d MMMM yyyy')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {hold.slotLabel} ({hold.startTime} – {hold.endTime})
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-xs text-zinc-400 mb-1">Box</p>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{hold.boxName}</p>
          </div>
        </div>
      </div>

      {/* Price breakdown */}
      <PriceBreakdown
        totalPaise={hold.amountPaise}
        advancePaise={hold.advancePaise}
        label="Slot rental"
      />

      {/* Cancellation note */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          Cancellations made more than 24 hours before the slot are eligible for a full refund.
          Check our{' '}
          <Link href="/legal/cancellation" className="underline underline-offset-2" target="_blank">
            cancellation policy
          </Link>
          .
        </p>
      </div>

      {/* Terms checkbox */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="terms-accept"
          checked={termsAccepted}
          onCheckedChange={(v) => setTermsAccepted(Boolean(v))}
        />
        <Label htmlFor="terms-accept" className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed cursor-pointer">
          I agree to the{' '}
          <Link href="/legal/terms" className="text-emerald-600 underline underline-offset-2 hover:text-emerald-700" target="_blank">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/legal/cancellation" className="text-emerald-600 underline underline-offset-2 hover:text-emerald-700" target="_blank">
            Cancellation Policy
          </Link>
        </Label>
      </div>

      {/* Pay button */}
      <Button
        variant="cta"
        size="lg"
        className="w-full"
        disabled={!termsAccepted || paying}
        loading={paying}
        onClick={onPay}
      >
        Pay {paiseToRupees(hold.advancePaise)} advance via Razorpay
      </Button>
    </div>
  )
}
