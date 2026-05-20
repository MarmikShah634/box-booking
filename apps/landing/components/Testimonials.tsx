import Image from 'next/image';

const testimonials = [
  {
    name: 'Arjun Mehta',
    role: 'Weekend cricketer, Bangalore',
    rating: 5,
    text: 'Booked a 7pm slot at Greenfield Arena in literally 45 seconds. Showed up, played, done. The hold countdown is a nice touch — never lost a slot.',
    seed: 'arjun-mehta-cricketer',
    venue: 'Greenfield Arena, Bangalore',
  },
  {
    name: 'Priya Nair',
    role: 'Office cricket league organizer',
    rating: 5,
    text: 'We book 3-4 slots every Friday for our company team. The bulk booking and invoice generation saves us hours every month.',
    seed: 'priya-nair-office',
    venue: 'Cricket Hub, Pune',
  },
  {
    name: 'Vikram Rao',
    role: 'Cricket coach, Hyderabad',
    rating: 5,
    text: 'Cancellation refund hit my account in 2 days. No follow-up emails needed. This is how venues should work.',
    seed: 'vikram-rao-coach',
    venue: 'SportZone Arena, Hyderabad',
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">Reviews</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">
            Players don't lie.
          </h2>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 flex flex-col gap-5 group hover:border-zinc-700 transition-colors"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" fill="#34d399" className="w-4 h-4">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-zinc-300 text-sm leading-relaxed flex-1">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Venue tag */}
              <div className="text-xs text-emerald-400 font-medium">{t.venue}</div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-1 border-t border-zinc-800">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={`https://picsum.photos/seed/${t.seed}/40/40`}
                    alt={t.name}
                    width={36}
                    height={36}
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{t.name}</div>
                  <div className="text-zinc-500 text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
