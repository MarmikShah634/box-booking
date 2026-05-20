'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--border)] shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12 l4-4 l4 4" />
            </svg>
          </div>
          <span className="text-[var(--text-primary)] font-semibold tracking-tight text-lg">
            Box<span className="text-emerald-600">Cricket</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { href: '#how-it-works', label: 'How it works' },
            { href: '#cities', label: 'Cities' },
            { href: '#for-owners', label: 'For owners' },
            { href: '#pricing', label: 'Pricing' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[var(--text-secondary)] text-sm font-medium hover:text-[var(--text-primary)] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="http://localhost:3000/auth/login"
            className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-4 py-2"
          >
            Sign in
          </a>
          <a
            href="http://localhost:3000"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors active:scale-[0.98]"
          >
            Book a turf
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            {open ? (
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg)] px-4 py-4 space-y-2">
          {[
            { href: '#how-it-works', label: 'How it works' },
            { href: '#cities', label: 'Cities' },
            { href: '#for-owners', label: 'For owners' },
            { href: '#pricing', label: 'Pricing' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-[var(--text-secondary)] font-medium text-sm"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-3 border-t border-[var(--border)] flex gap-3">
            <a
              href="http://localhost:3000/auth/login"
              className="flex-1 text-center py-2.5 text-sm font-medium border border-[var(--border)] rounded-lg"
            >
              Sign in
            </a>
            <a
              href="http://localhost:3000"
              className="flex-1 text-center py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-lg"
            >
              Book now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
