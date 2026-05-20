'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CheckCircle, Share2, Download, ArrowLeft } from 'lucide-react'
import { DatePicker } from '@/components/booking/DatePicker'
import { SlotGrid } from '@/components/booking/SlotGrid'
import { PriceBreakdown } from '@/components/booking/PriceBreakdown'
import { ConfirmSheet } from '@/components/booking/ConfirmSheet'
import { Button } from '@/components/ui/button'
import { useSlotAvailability, type Slot } from '@/hooks/useSlotAvailability'
import { useHoldStore } from '@/store/holdStore'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useRazorpayLauncher } from '@/components/booking/RazorpayLauncher'
import { api } from '@/lib/api'
import { paiseToRupees } from '@/lib/currency'
import { formatDate } from '@/lib/time'
import { toast } from '@/hooks/useToast'
import { friendlyError } from '@/lib/errorMessages'
import type { RazorpayPaymentResponse } from '@/lib/razorpay'
import Link from 'next/link'

type Stage = 'select' | 'confirm' | 'success'

interface InitiateResponse {
  orderId: string
  bookingId: string
  amountPaise: number
}

interface BookingSuccess {
  id: string
  invoiceId?: string
  venueName: string
  venueAddress: string
  boxName: string
  date: string
  slotLabel: string
  totalPaise: number
  advancePaise: number
  balancePaise: number
}

export default function BookPage() {
  const params = useParams()
  const router = useRouter()
  const boxId = params.boxId as string

  const { user } = useCurrentUser()
  const { hold, setHold, clearHold } = useHoldStore()

  const [stage, setStage] = useState<Stage>('select')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [isHolding, setIsHolding] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [successData, setSuccessData] = useState<BookingSuccess | null>(null)
  const [pendingOrder, setPendingOrder] = useState<InitiateResponse | null>(null)

  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''
  const { slots, loading: slotsLoading } = useSlotAvailability(boxId, dateStr)

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot)
  }

  const handleConfirmSlot = async () => {
    if (!selectedSlot || !selectedDate) return
    setIsHolding(true)
    try {
      const result = await api.post<{
        holdId: string
        expiresAt: string
        boxName: string
        venueName: string
        venueAddress: string
        amountPaise: number
        advancePaise: number
      }>('/api/v1/bookings/holds', {
        boxId,
        slotId: selectedSlot.id,
        date: dateStr,
      })

      if (!result.ok) {
        toast({ title: 'Slot unavailable', description: friendlyError(result.error.error), variant: 'destructive' })
        return
      }

      setHold({
        id: result.data.holdId,
        boxId,
        boxName: result.data.boxName,
        venueName: result.data.venueName,
        venueAddress: result.data.venueAddress,
        date: dateStr,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        slotLabel: selectedSlot.label,
        amountPaise: result.data.amountPaise,
        advancePaise: result.data.advancePaise,
        expiresAt: result.data.expiresAt,
      })
      setStage('confirm')
    } catch {
      toast({ title: 'Error', description: 'Failed to hold slot. Please try again.', variant: 'destructive' })
    } finally {
      setIsHolding(false)
    }
  }

  const handleInitiatePayment = async () => {
    if (!hold) return
    setIsPaying(true)
    try {
      const result = await api.post<InitiateResponse>('/api/v1/bookings/initiate', {
        holdId: hold.id,
      })

      if (!result.ok) {
        toast({ title: 'Payment initiation failed', description: friendlyError(result.error.error), variant: 'destructive' })
        setIsPaying(false)
        return
      }

      setPendingOrder(result.data)
      launch()
    } catch {
      toast({ title: 'Error', description: 'Could not initiate payment.', variant: 'destructive' })
      setIsPaying(false)
    }
  }

  const handlePaymentSuccess = useCallback(async (response: RazorpayPaymentResponse) => {
    if (!pendingOrder) return
    try {
      const verifyResult = await api.post<BookingSuccess>(`/api/v1/bookings/${pendingOrder.bookingId}/verify`, {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      })

      if (!verifyResult.ok) {
        toast({ title: 'Payment verification failed', description: friendlyError(verifyResult.error.error), variant: 'destructive' })
        return
      }

      clearHold()
      setSuccessData(verifyResult.data)
      setStage('success')
    } finally {
      setIsPaying(false)
    }
  }, [pendingOrder, clearHold])

  const { launch } = useRazorpayLauncher({
    orderId: pendingOrder?.orderId || '',
    amountPaise: pendingOrder?.amountPaise || 0,
    description: hold ? `${hold.boxName} – ${hold.slotLabel}` : 'Cricket box booking',
    userName: user?.name,
    userPhone: user?.phone,
    userEmail: user?.email,
    onSuccess: handlePaymentSuccess,
    onDismiss: () => setIsPaying(false),
  })

  if (stage === 'success' && successData) {
    return <SuccessPage data={successData} />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Back navigation */}
      <button
        onClick={() => stage === 'confirm' ? (clearHold(), setStage('select')) : router.back()}
        className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 mb-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
      >
        <ArrowLeft className="w-4 h-4" />
        {stage === 'confirm' ? 'Back to slot selection' : 'Back'}
      </button>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {['Select slot', 'Confirm & pay'].map((step, i) => {
          const stepStage = i === 0 ? 'select' : 'confirm'
          const isActive = stage === stepStage
          const isPast = (stage === 'confirm' && i === 0)
          return (
            <div key={step} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-700" />}
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-emerald-600 text-white' : isPast ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                  {isPast ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-medium ${isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`}>
                  {step}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {stage === 'select' && (
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Select date & slot</h1>

          {/* Date picker */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Pick a date</h2>
            <DatePicker
              selected={selectedDate}
              onSelect={(date) => { setSelectedDate(date); setSelectedSlot(null) }}
            />
          </div>

          {/* Slot grid */}
          {selectedDate && (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
                Available slots for {formatDate(selectedDate, 'EEEE, d MMM')}
              </h2>
              <SlotGrid
                slots={slots}
                loading={slotsLoading}
                selected={selectedSlot}
                onSelect={handleSlotSelect}
              />
            </div>
          )}

          {/* Price preview + confirm button */}
          {selectedSlot && (
            <div className="space-y-4 animate-slide-up">
              <PriceBreakdown
                totalPaise={selectedSlot.pricePaise}
                advancePaise={Math.ceil(selectedSlot.pricePaise * 0.3)}
                label={selectedSlot.label}
              />
              <Button
                size="lg"
                variant="cta"
                className="w-full"
                onClick={handleConfirmSlot}
                loading={isHolding}
              >
                Confirm slot — {paiseToRupees(selectedSlot.pricePaise)}
              </Button>
              <p className="text-xs text-center text-zinc-400">
                Slot will be held for 10 minutes after confirmation.
              </p>
            </div>
          )}
        </div>
      )}

      {stage === 'confirm' && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Confirm & pay</h1>
          <ConfirmSheet onPay={handleInitiatePayment} paying={isPaying} />
        </div>
      )}
    </div>
  )
}

function SuccessPage({ data }: { data: BookingSuccess }) {
  const shareBooking = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'My cricket booking', text: `I've booked ${data.boxName} at ${data.venueName} on ${formatDate(data.date)}!` })
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Booking confirmed!</h1>
      <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">
        You're all set. See you on the pitch!
      </p>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-left p-5 space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Venue</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100 text-right max-w-[200px]">{data.venueName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Box</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{data.boxName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Date</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatDate(data.date, 'EEE, d MMMM yyyy')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Slot</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{data.slotLabel}</span>
        </div>
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Balance to pay at venue</span>
          <span className="font-bold text-amber-600 dark:text-amber-400">{paiseToRupees(data.balancePaise)}</span>
        </div>
        <div className="text-xs text-zinc-400 leading-relaxed">{data.venueAddress}</div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="flex-1">
          <Link href="/me">View my bookings</Link>
        </Button>
        <Button variant="outline" onClick={shareBooking} className="flex-1 gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
        {data.invoiceId && (
          <Button asChild variant="outline" className="flex-1 gap-2">
            <Link href={`/api/v1/invoices/${data.invoiceId}`} target="_blank">
              <Download className="w-4 h-4" />
              Invoice
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
