'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { paiseToRupees } from '@/lib/currency'
import { AlertTriangle } from 'lucide-react'

interface CancelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  refundPaise: number
  onConfirm: (bookingId: string) => Promise<void>
}

export function CancelDialog({ open, onOpenChange, bookingId, refundPaise, onConfirm }: CancelDialogProps) {
  const [cancelling, setCancelling] = useState(false)

  const handleConfirm = async () => {
    setCancelling(true)
    try {
      await onConfirm(bookingId)
      onOpenChange(false)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle>Cancel this booking?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. You'll receive a refund based on our cancellation policy.
          </DialogDescription>
        </DialogHeader>

        {/* Refund preview */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 my-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Estimated refund</span>
            <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
              {paiseToRupees(refundPaise)}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Refund will be credited to your original payment method within 5–7 business days.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cancelling}>
            Keep booking
          </Button>
          <Button variant="destructive" onClick={handleConfirm} loading={cancelling}>
            Yes, cancel booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
