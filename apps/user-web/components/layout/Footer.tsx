import Link from 'next/link'

const footerLinks = [
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/#about' },
      { label: 'Careers', href: '/#careers' },
      { label: 'Contact', href: '/#contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/legal/terms' },
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Refund Policy', href: '/legal/refund' },
      { label: 'Cancellation Policy', href: '/legal/cancellation' },
    ],
  },
  {
    heading: 'Cities',
    links: [
      { label: 'Bangalore', href: '/city/bangalore' },
      { label: 'Mumbai', href: '/city/mumbai' },
      { label: 'Pune', href: '/city/pune' },
      { label: 'Delhi', href: '/city/delhi' },
      { label: 'Hyderabad', href: '/city/hyderabad' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <path d="M3 12h3M18 12h3M12 3v3M12 18v3" strokeLinecap="round" />
                </svg>
              </div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">BoxCricket</span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[220px]">
              Book cricket boxes across India. Fast, fair, and always available.
            </p>
          </div>

          {/* Links */}
          {footerLinks.map(({ heading, links }) => (
            <div key={heading}>
              <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                {heading}
              </h3>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            &copy; {new Date().getFullYear()} BoxCricket Technologies Pvt. Ltd. All rights reserved.
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">Made in India</p>
        </div>
      </div>
    </footer>
  )
}
