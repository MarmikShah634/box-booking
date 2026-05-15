'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { CancelDialog } from './CancelDialog'
import { ReviewDialog } from './ReviewDialog'

interface BookingActionsProps {
  bookingId: string
  canCancel: boolean
  canReview: boolean
  refundPaise: number
  invoiceId?: string
}

export function BookingActions({ bookingId, canCancel, canReview, refundPaise, invoiceId }: BookingActionsProps) {
  const router = useRouter()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)

  const handleCancel = async (id: string) => {
    const res = await api.post(`/bookings/${id}/cancel`)
    if (res.ok) router.refresh()
  }

  const handleReview = async (data: { rating: number; comment: string }) => {
    const res = await api.post(`/bookings/${bookingId}/review`, data)
    if (res.ok) router.refresh()
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {canCancel && (
          <button
            onClick={() => setCancelOpen(true)}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Cancel booking
          </button>
        )}
        {canReview && (
          <button
            onClick={() => setReviewOpen(true)}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Leave a review
          </button>
        )}
        {invoiceId && (
          <a
            href={`/invoices/${invoiceId}`}
            className="w-full text-center py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Download invoice
          </a>
        )}
      </div>

      <CancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        bookingId={bookingId}
        refundPaise={refundPaise}
        onConfirm={handleCancel}
      />
      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        bookingId={bookingId}
        onSubmit={handleReview}
      />
    </>
  )
}
