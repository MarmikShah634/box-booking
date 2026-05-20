'use client'

import { useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PhotoCarouselProps {
  images: string[]
  venueName: string
}

export function PhotoCarousel({ images, venueName }: PhotoCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  if (!images || images.length === 0) return null

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {images.map((src, i) => (
            <div key={i} className="flex-[0_0_100%] relative h-72 sm:h-96">
              <Image
                src={src}
                alt={`${venueName} - photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            aria-label="Previous photo"
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full',
              'bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/50',
              'flex items-center justify-center shadow-sm',
              'hover:bg-white dark:hover:bg-zinc-900 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
            )}
          >
            <ChevronLeft className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          </button>
          <button
            onClick={scrollNext}
            aria-label="Next photo"
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full',
              'bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/50',
              'flex items-center justify-center shadow-sm',
              'hover:bg-white dark:hover:bg-zinc-900 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
            )}
          >
            <ChevronRight className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Go to photo ${i + 1}`}
              className="w-1.5 h-1.5 rounded-full bg-white/70 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            />
          ))}
        </div>
      )}
    </div>
  )
}
