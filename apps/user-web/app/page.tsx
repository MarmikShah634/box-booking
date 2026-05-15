import { Suspense } from 'react'
import { Hero } from '@/components/home/Hero'
import { CityPicker } from '@/components/home/CityPicker'
import { FeaturedVenues } from '@/components/home/FeaturedVenues'
import { Skeleton } from '@/components/ui/skeleton'

function FeaturedVenuesSkeleton() {
  return (
    <section className="py-16 bg-white dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <Skeleton className="h-44 rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// How it works section
function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Pick your city',
      description: 'Choose from 7 major cities across India. Browse hundreds of venues by location, price, and amenities.',
    },
    {
      step: '02',
      title: 'Select a slot',
      description: 'See real-time availability. Choose your date and preferred time slot. Instant slot hold for 10 minutes.',
    },
    {
      step: '03',
      title: 'Pay & play',
      description: 'Pay a small advance via Razorpay. Pay the balance at the venue. Show your booking confirmation and play.',
    },
  ]

  return (
    <section id="how-it-works" className="py-16 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-12 max-w-xl">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Book in under 2 minutes
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm">
            No calls, no waiting. Instant confirmation directly to your phone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.step}>
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center mb-4">
                <span className="text-sm font-bold text-white">{step.step}</span>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <CityPicker />
      <Suspense fallback={<FeaturedVenuesSkeleton />}>
        <FeaturedVenues />
      </Suspense>
      <HowItWorks />
    </>
  )
}
