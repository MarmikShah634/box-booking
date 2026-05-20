const stats = [
  { value: '7', label: 'Cities', suffix: '+' },
  { value: '340', label: 'Venues', suffix: '+' },
  { value: '12,800', label: 'Bookings', suffix: '+' },
  { value: '4.8', label: 'Avg rating', suffix: '/5' },
  { value: '< 60s', label: 'To book', suffix: '' },
];

export function StatsBar() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--bg-card)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-0 md:divide-x divide-[var(--border)]">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center px-4">
              <div className="text-3xl font-bold tracking-tight text-[var(--text-primary)] font-mono tabular-nums">
                {stat.value}
                <span className="text-emerald-600 text-xl">{stat.suffix}</span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-1 font-medium uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
