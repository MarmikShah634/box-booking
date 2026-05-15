import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-card)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 12 l4-4 l4 4" />
                </svg>
              </div>
              <span className="font-semibold tracking-tight">
                Box<span className="text-emerald-600">Cricket</span>
              </span>
            </div>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-[260px]">
              India's cricket box booking platform. Find, book, and play.
            </p>
          </div>

          {/* Players */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-4">
              Players
            </h4>
            <ul className="space-y-3 text-sm">
              {['Find venues', 'How it works', 'Cancellation policy', 'GST invoices'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Owners */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-4">
              Venue owners
            </h4>
            <ul className="space-y-3 text-sm">
              {['List your venue', 'Owner dashboard', 'Pricing', 'Support'].map((item) => (
                <li key={item}>
                  <a href="http://localhost:3002/owner/register" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-4">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Terms', href: 'http://localhost:3000/legal/terms' },
                { label: 'Privacy', href: 'http://localhost:3000/legal/privacy' },
                { label: 'Refund policy', href: 'http://localhost:3000/legal/refund' },
                { label: 'Cancellation', href: 'http://localhost:3000/legal/cancellation' },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-secondary)]">
            &copy; {new Date().getFullYear()} BoxCricket Technologies Pvt. Ltd. All rights reserved.
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Made with care in India
          </p>
        </div>
      </div>
    </footer>
  );
}
