const steps = [
  {
    number: '01',
    title: 'Pick your city',
    description:
      'Browse venues across Bangalore, Mumbai, Pune, Delhi, Hyderabad, Chennai, and Ahmedabad.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Choose a slot',
    description:
      'See live availability. Green slots are open. Pick your date, time, and duration.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Pay advance online',
    description:
      'Secure advance payment via Razorpay. Remaining balance paid at the venue. GST invoice generated instantly.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Play!',
    description:
      'Show up and play. Cancel anytime before 24h for full refund. No questions asked.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header — left aligned (anti-center bias) */}
      <div className="mb-16">
        <p className="text-emerald-600 text-sm font-semibold uppercase tracking-widest mb-3">Process</p>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-[var(--text-primary)] max-w-md">
          From search to pitch in 4 steps
        </h2>
      </div>

      {/* Zig-zag layout instead of 3-col card grid */}
      <div className="space-y-0">
        {steps.map((step, index) => (
          <div
            key={step.number}
            className={`flex flex-col md:flex-row items-start gap-8 py-12 border-t border-[var(--border)] ${
              index % 2 === 1 ? 'md:flex-row-reverse' : ''
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Number */}
            <div className="flex-shrink-0">
              <span className="text-8xl font-bold text-[var(--border)] font-mono tabular-nums select-none leading-none">
                {step.number}
              </span>
            </div>

            {/* Content */}
            <div className={`flex-1 ${index % 2 === 1 ? 'md:text-right' : ''}`}>
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-600 mb-4 ${
                  index % 2 === 1 ? 'md:ml-auto' : ''
                }`}
              >
                {step.icon}
              </div>
              <h3 className="text-2xl font-bold tracking-tight mb-3 text-[var(--text-primary)]">
                {step.title}
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed max-w-md text-base">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
