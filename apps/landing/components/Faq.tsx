'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'How does the advance payment work?',
    a: 'You pay 50% of the slot cost online to lock your booking. The remaining 50% is paid directly at the venue before you play.',
  },
  {
    q: 'What is the cancellation policy?',
    a: 'Cancel more than 24 hours before your slot for a full refund. Cancel between 6-24 hours for a 50% refund. Less than 6 hours — no refund.',
  },
  {
    q: 'How long does a refund take?',
    a: 'Refunds are processed via Razorpay and typically arrive within 5-7 business days to your original payment method.',
  },
  {
    q: 'Can I modify a booking?',
    a: 'Currently you can cancel and rebook. Booking modification is on our roadmap.',
  },
  {
    q: 'Are the venues verified?',
    a: 'Yes. Every venue goes through our review process before going live. We verify address, amenities, and photos.',
  },
  {
    q: 'Do I get a GST invoice?',
    a: 'Yes. A GST-compliant PDF invoice is generated automatically after payment and emailed to you.',
  },
  {
    q: 'How do I list my venue?',
    a: 'Register as an owner, complete KYC, connect your Razorpay account, create your venue listing, and submit for approval. Takes about 10 minutes.',
  },
  {
    q: 'Is BoxCricket available in my city?',
    a: 'Currently available in Bangalore, Mumbai, Pune, Delhi, Hyderabad, Chennai, and Ahmedabad. More cities launching soon.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Left */}
        <div className="lg:sticky lg:top-24 self-start">
          <p className="text-emerald-600 text-sm font-semibold uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-[var(--text-primary)] mb-4">
            Good questions.
          </h2>
          <p className="text-[var(--text-secondary)] text-base leading-relaxed max-w-sm">
            Can't find what you're looking for? Email us at{' '}
            <a href="mailto:support@boxcricket.in" className="text-emerald-600 hover:underline">
              support@boxcricket.in
            </a>
          </p>
        </div>

        {/* Right — accordion */}
        <div className="space-y-0">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-[var(--border)]">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-5 text-left gap-4 group"
                aria-expanded={open === i}
              >
                <span className="font-medium text-[var(--text-primary)] text-sm group-hover:text-emerald-600 transition-colors">
                  {faq.q}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className={`w-4 h-4 flex-shrink-0 text-[var(--text-secondary)] transition-transform ${open === i ? 'rotate-45' : ''}`}
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>

              {open === i && (
                <div className="pb-5 pr-8 text-sm text-[var(--text-secondary)] leading-relaxed animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
