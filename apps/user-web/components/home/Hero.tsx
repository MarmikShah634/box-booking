import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] md:min-h-[80dvh] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://picsum.photos/seed/cricket-box-venue/1600/900"
          alt="Cricket box venue at night with green floodlights"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/60 to-zinc-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-20">
        <div className="max-w-2xl">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-3 py-1 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
            <span className="text-xs text-emerald-300 font-medium">Live slots available now</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-none mb-5">
            Book a cricket box{' '}
            <span className="text-emerald-400">near you</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed mb-8 max-w-xl">
            Find and book premium box cricket venues across India. Real-time slot availability, instant confirmation, and hassle-free payments.
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" variant="cta" className="text-base shadow-lg">
              <Link href="/city/bangalore">
                <MapPin className="w-5 h-5" />
                Find venues near me
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base border-white/20 bg-white/10 text-white hover:bg-white/20">
              <Link href="/#how-it-works">How it works</Link>
            </Button>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8">
            {[
              '200+ venues',
              '7 cities',
              '50,000+ bookings',
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-sm text-zinc-400">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
