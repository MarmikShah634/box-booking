const ownerBenefits = [
  {
    title: 'Zero upfront cost',
    description: 'Free to list during pre-launch. Start taking bookings immediately.',
  },
  {
    title: 'Razorpay payouts',
    description: 'Advance payments go directly to your Razorpay account. No platform escrow.',
  },
  {
    title: 'Smart scheduling',
    description: 'Set dynamic pricing for peak hours, weekends, and holidays from a simple dashboard.',
  },
  {
    title: 'Owner dashboard',
    description: 'Revenue charts, occupancy %, today\'s bookings, and NO_SHOW management.',
  },
  {
    title: 'Automated invoices',
    description: 'GST-compliant invoices generated and emailed to players automatically.',
  },
  {
    title: 'Moderation support',
    description: 'Every venue reviewed by our team. High-quality listings only.',
  },
];

export function ForOwners() {
  return (
    <section id="for-owners" className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Left */}
        <div className="lg:sticky lg:top-24">
          <p className="text-emerald-600 text-sm font-semibold uppercase tracking-widest mb-4">
            For venue owners
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-[var(--text-primary)] mb-6">
            More bookings,
            <br />
            less coordination.
          </h2>
          <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-8 max-w-md">
            List your box cricket venue in 10 minutes. Players discover it, book online, pay advance,
            and show up ready to play. You collect the balance at the venue.
          </p>
          <a
            href="http://localhost:3002/owner/register"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors active:scale-[0.98] group"
          >
            List your venue free
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 group-hover:translate-x-0.5 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 mt-12 pt-12 border-t border-[var(--border)]">
            <div>
              <div className="text-3xl font-bold tracking-tight text-[var(--text-primary)] font-mono">
                ₹3.2L
              </div>
              <div className="text-[var(--text-secondary)] text-sm mt-1">
                avg monthly revenue per venue
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight text-[var(--text-primary)] font-mono">
                73%
              </div>
              <div className="text-[var(--text-secondary)] text-sm mt-1">
                avg occupancy rate
              </div>
            </div>
          </div>
        </div>

        {/* Right — feature list */}
        <div className="space-y-0">
          {ownerBenefits.map((b, i) => (
            <div
              key={b.title}
              className="flex gap-5 py-6 border-b border-[var(--border)] group"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600/10 text-emerald-600 flex items-center justify-center text-sm font-bold font-mono mt-0.5">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">{b.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
