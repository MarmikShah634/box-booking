'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  comment: z.string().min(10, 'Write at least 10 characters').max(500),
})

type ReviewForm = z.infer<typeof reviewSchema>

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  onSubmit: (data: { rating: number; comment: string }) => Promise<void>
}

export function ReviewDialog({ open, onOpenChange, bookingId: _bookingId, onSubmit }: ReviewDialogProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: '' },
  })

  const rating = watch('rating')

  const handleStarClick = (star: number) => setValue('rating', star)

  const onFormSubmit = async (data: ReviewForm) => {
    await onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave a review</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
          {/* Star rating */}
          <div>
            <Label className="mb-2 block">Your rating</Label>
            <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(null)}
                  className="p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                >
                  <Star
                    className={cn(
                      'w-7 h-7 transition-colors',
                      (hoveredStar !== null ? star <= hoveredStar : star <= rating)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-zinc-300 dark:text-zinc-600',
                    )}
                  />
                </button>
              ))}
            </div>
            {errors.rating && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.rating.message}</p>
            )}
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="review-comment" className="mb-2 block">Your experience</Label>
            <textarea
              id="review-comment"
              rows={4}
              placeholder="Tell others about the venue, facilities, and overall experience..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              {...register('comment')}
            />
            {errors.comment && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.comment.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Submit review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
