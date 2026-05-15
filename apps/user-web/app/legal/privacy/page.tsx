export const metadata = { title: 'Privacy Policy — BoxCricket' };

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-zinc-500 text-sm mb-10">Last updated: 1 January 2026</p>
      <div className="text-sm leading-relaxed space-y-6 text-zinc-700 dark:text-zinc-300">
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Data we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Phone number (required for OTP login)</li>
            <li>Name and email (optional, for invoice)</li>
            <li>Booking history (slot dates, venues, payment status)</li>
            <li>Device IP address (for rate limiting)</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Data processors</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>MSG91 — SMS OTP delivery</li>
            <li>Resend — Email notifications</li>
            <li>Cloudflare R2 — File storage (invoices, photos)</li>
            <li>Razorpay — Payment processing</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">Your rights (DPDP Act 2023)</h2>
          <p>You may request a copy of your data or account deletion at any time via your account settings.</p>
        </section>
      </div>
    </div>
  );
}
