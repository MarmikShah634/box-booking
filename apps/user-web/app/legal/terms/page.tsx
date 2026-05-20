export const metadata = { title: 'Terms of Service — BoxCricket' };

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
      <p className="text-zinc-500 text-sm mb-10">Last updated: 1 January 2026</p>
      <div className="prose prose-zinc dark:prose-invert text-sm leading-relaxed space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-2">1. Acceptance</h2>
          <p>By using BoxCricket you agree to these terms. If you disagree, do not use the platform.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">2. Bookings</h2>
          <p>Bookings are confirmed only after advance payment. The venue owner is responsible for the facility. BoxCricket is a booking intermediary.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">3. Payments</h2>
          <p>Advance payments processed via Razorpay go directly to the venue owner&apos;s account. BoxCricket does not hold funds.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">4. Cancellation</h2>
          <p>See our <a href="/legal/cancellation" className="text-emerald-600 hover:underline">Cancellation Policy</a>.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">5. Jurisdiction</h2>
          <p>Disputes shall be subject to the jurisdiction of courts of the city where the booked venue is located, governed by Indian law.</p>
        </section>
      </div>
    </div>
  );
}
