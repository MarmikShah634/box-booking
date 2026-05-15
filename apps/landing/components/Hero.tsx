import Image from 'next/image';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/seed/cricket-field-green/1920/1080"
          alt="Cricket field"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/80 to-zinc-950/20" />
      </div>

      {/* Content — left-aligned (no centered hero bias) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full pt-24 pb-16">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-slow" />
            Live in 7 cities across India
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none text-white mb-6 animate-fade-up">
            Cricket boxes,
            <br />
            <span className="text-emerald-400">booked in 60s.</span>
          </h1>

          {/* Sub */}
          <p className="text-lg text-zinc-300 leading-relaxed max-w-xl mb-10 animate-fade-up animation-delay-100">
            Discover and reserve box cricket venues near you. Real-time availability, instant confirmation,
            and GST invoices — all in one place.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 animate-fade-up animation-delay-200">
            <a
              href="http://localhost:3000"
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base px-8 py-4 rounded-xl transition-colors active:scale-[0.98] group"
            >
              Find venues near you
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 group-hover:translate-x-0.5 transition-transform">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a
              href="http://localhost:3002/owner/register"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-base px-8 py-4 rounded-xl border border-white/20 transition-colors backdrop-blur-sm"
            >
              List your venue
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center gap-6 animate-fade-up animation-delay-300">
            <div className="flex -space-x-2">
              {['seed/player1/40/40', 'seed/player2/40/40', 'seed/player3/40/40', 'seed/player4/40/40'].map((seed, i) => (
                <div key={i} className="w-9 h-9 rounded-full border-2 border-zinc-900 overflow-hidden">
                  <Image
                    src={`https://picsum.photos/${seed}`}
                    alt="Player"
                    width={36}
                    height={36}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="text-sm text-zinc-400">
              <span className="text-white font-semibold">4,200+</span> matches booked this month
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-2 text-zinc-500 animate-bounce">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
