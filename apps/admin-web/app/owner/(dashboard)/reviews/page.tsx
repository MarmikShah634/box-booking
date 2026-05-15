'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { ownerApi } from '@/lib/api'
import type { Review } from '@/types'
import { ReviewReplyDialog } from '@/components/owner/reviews/ReviewReplyDialog'

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [replyTarget, setReplyTarget] = useState<string | null>(null)

  useEffect(() => {
    ownerApi<{ data: Review[] }>('/reviews/mine').then((res) => {
      if (res.ok) setReviews(res.data.data)
      setLoading(false)
    })
  }, [])

  const handleReplySuccess = (reviewId: string, reply: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, ownerReply: reply, ownerRepliedAt: new Date().toISOString() } : r)),
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">{reviews.length} total reviews</p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-gray-500">
          No reviews yet. Reviews appear after customers complete their bookings.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{review.userName}</span>
                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                  {review.ownerReply && (
                    <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
                      <p className="text-xs font-semibold text-emerald-700 mb-1">Your reply</p>
                      <p className="text-sm text-emerald-900">{review.ownerReply}</p>
                    </div>
                  )}
                </div>
                {!review.ownerReply && (
                  <button
                    onClick={() => setReplyTarget(review.id)}
                    className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    Reply
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {replyTarget && (
        <ReviewReplyDialog
          reviewId={replyTarget}
          open={true}
          onClose={() => setReplyTarget(null)}
          onSuccess={(reply) => {
            handleReplySuccess(replyTarget, reply)
            setReplyTarget(null)
          }}
        />
      )}
    </div>
  )
}
