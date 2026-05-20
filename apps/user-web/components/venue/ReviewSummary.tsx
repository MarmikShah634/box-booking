import { Star } from 'lucide-react'
import { formatDate } from '@/lib/time'

export interface Review {
  id: string
  author: string
  rating: number
  comment: string
  createdAt: string
}

interface ReviewSummaryProps {
  reviews: Review[]
  averageRating?: number
  totalCount?: number
}

function StarBar({ rating, maxRating = 5 }: { rating: number; maxRating?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of ${maxRating} stars`}>
      {Array.from({ length: maxRating }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < Math.round(rating) ? 'text-amber-500 fill-amber-500' : 'text-zinc-300 dark:text-zinc-600'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export function ReviewSummary({ reviews, averageRating, totalCount }: ReviewSummaryProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4">
        No reviews yet. Book and play to leave the first review.
      </p>
    )
  }

  return (
    <div>
      {/* Summary header */}
      {averageRating !== undefined && (
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="text-5xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {averageRating.toFixed(1)}
          </div>
          <div>
            <StarBar rating={averageRating} />
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Based on {totalCount || reviews.length} review{(totalCount || reviews.length) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Review list */}
      <div className="space-y-5">
        {reviews.map((review) => (
          <div key={review.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {review.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{review.author}</p>
                  <p className="text-xs text-zinc-400">{formatDate(review.createdAt)}</p>
                </div>
              </div>
              <StarBar rating={review.rating} />
            </div>
            {review.comment && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pl-10">
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
