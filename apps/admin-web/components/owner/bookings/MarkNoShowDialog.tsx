'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { ownerApi } from '@/lib/api'

interface MarkNoShowDialogProps {
  bookingId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function MarkNoShowDialog({ bookingId, open, onClose, onSuccess }: MarkNoShowDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    const res = await ownerApi(`/bookings/${bookingId}/no-show`, { method: 'POST' })
    setLoading(false)
    if (res.ok) {
      onSuccess()
      onClose()
    } else {
      setError(res.error)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Mark as No-Show?</h3>
            <p className="mt-1 text-sm text-gray-500">
              This will mark the customer as a no-show. This action cannot be undone.
            </p>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? 'Marking...' : 'Mark No-Show'}
          </button>
        </div>
      </div>
    </div>
  )
}
