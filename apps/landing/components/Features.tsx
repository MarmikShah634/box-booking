const features = [
  {
    title: 'Live availability',
    description: 'Slots refresh every 20 seconds. No phantom availability, no double-bookings.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: 'Instant GST invoice',
    description: 'Tax-compliant PDF invoice generated and emailed seconds after payment.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    title: 'Flexible cancellation',
    description: '100% refund if you cancel 24h before. 50% within 6h. Transparent, always.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    title: 'Pay only 50% advance',
    description: 'Lock your slot with just half the amount. Pay the rest at the venue.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    title: 'Verified venues',
    description: 'Every venue reviewed and approved by our team before going live.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: 'Real player reviews',
    description: 'Only players who completed a booking can review. No fake ratings.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
];

export function Features() {
  return (
    <section className="py-24 bg-[var(--bg-card)] border-y border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <p className="text-emerald-600 text-sm font-semibold uppercase tracking-widest mb-3">
              Why BoxCricket
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-[var(--text-primary)]">
              Built for players,
              <br />
              not just bookings.
            </h2>
          </div>
          <p className="text-[var(--text-secondary)] max-w-sm text-base leading-relaxed">
            We obsess over the details so you can focus on the game.
          </p>
        </div>

        {/* Asymmetric 2-col layout instead of 3 equal cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`p-8 border-b border-[var(--border)] ${
                i % 2 === 0 ? 'md:border-r' : ''
              } group hover:bg-emerald-600/5 transition-colors`}
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-2 text-[var(--text-primary)]">
                {feature.title}
              </h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
