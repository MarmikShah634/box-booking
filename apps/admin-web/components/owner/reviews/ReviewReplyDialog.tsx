'use client'

import { useState } from 'react'
import { ownerApi } from '@/lib/api'

interface ReviewReplyDialogProps {
  reviewId: string
  open: boolean
  onClose: () => void
  onSuccess: (reply: string) => void
}

export function ReviewReplyDialog({ reviewId, open, onClose, onSuccess }: ReviewReplyDialogProps) {
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!reply.trim()) { setError('Reply cannot be empty'); return }
    setLoading(true)
    setError(null)
    const res = await ownerApi(`/reviews/${reviewId}/reply`, { method: 'POST', body: { reply } })
    setLoading(false)
    if (res.ok) {
      onSuccess(reply)
      onClose()
      setReply('')
    } else {
      setError(res.error)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="mb-4 font-semibold text-gray-900">Reply to Review</h3>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={4}
          placeholder="Write your reply..."
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Reply'}
          </button>
        </div>
      </div>
    </div>
  )
}
