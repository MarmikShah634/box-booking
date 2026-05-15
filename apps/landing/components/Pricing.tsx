const plans = [
  {
    code: 'FREE',
    name: 'Pre-launch',
    price: '₹0',
    period: 'during beta',
    highlight: false,
    description: 'Full platform access while we\'re in pre-launch mode.',
    features: [
      '1 venue',
      'Up to 4 boxes',
      'Unlimited bookings',
      'SMS + email notifications',
      'GST invoice generation',
      'Razorpay payouts',
    ],
    cta: 'Get started free',
    href: 'http://localhost:3002/owner/register',
  },
  {
    code: 'BASIC',
    name: 'Basic',
    price: '₹1,499',
    period: 'per month',
    highlight: false,
    description: 'For individual venue owners.',
    features: [
      '1 venue',
      'Up to 4 boxes per venue',
      'Unlimited bookings',
      'SMS + email notifications',
      'GST invoice generation',
      'Priority moderation (48h)',
    ],
    cta: 'Start Basic',
    href: 'http://localhost:3002/owner/register',
  },
  {
    code: 'PRO',
    name: 'Pro',
    price: '₹3,999',
    period: 'per month',
    highlight: true,
    description: 'For chains and multi-venue operators.',
    features: [
      'Unlimited venues',
      'Unlimited boxes',
      'Unlimited bookings',
      'Priority SMS + email',
      'GST invoice generation',
      'Fast-track moderation (24h)',
      'Dedicated support',
      'Advanced analytics (coming soon)',
    ],
    cta: 'Start Pro',
    href: 'http://localhost:3002/owner/register',
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-[var(--bg-card)] border-y border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-14">
          <p className="text-emerald-600 text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-[var(--text-primary)]">
            Simple, honest pricing.
          </h2>
          <p className="text-[var(--text-secondary)] mt-3 text-base">
            Currently in pre-launch — list your venue free.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.code}
              className={`rounded-2xl p-7 flex flex-col gap-6 border transition-all ${
                plan.highlight
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-[var(--bg)] border-[var(--border)] hover:border-emerald-600/40'
              }`}
            >
              {plan.highlight && (
                <div className="self-start bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  Most popular
                </div>
              )}

              <div>
                <div className={`text-xs font-semibold uppercase tracking-widest mb-1 ${plan.highlight ? 'text-emerald-200' : 'text-[var(--text-secondary)]'}`}>
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-bold tracking-tight font-mono ${plan.highlight ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlight ? 'text-emerald-200' : 'text-[var(--text-secondary)]'}`}>
                    /{plan.period}
                  </span>
                </div>
                <p className={`text-sm mt-2 ${plan.highlight ? 'text-emerald-100' : 'text-[var(--text-secondary)]'}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                      className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-emerald-200' : 'text-emerald-600'}`}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className={plan.highlight ? 'text-emerald-50' : 'text-[var(--text-secondary)]'}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors active:scale-[0.98] ${
                  plan.highlight
                    ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
