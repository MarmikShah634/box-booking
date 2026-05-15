export const metadata = { title: 'Refund Policy — BoxCricket' };
export default function RefundPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Refund Policy</h1>
      <p className="text-zinc-500 text-sm mb-10">Last updated: 1 January 2026</p>
      <div className="text-sm leading-relaxed space-y-4 text-zinc-700 dark:text-zinc-300">
        <p>Refunds are processed to the original payment method via Razorpay within 5–7 business days.</p>
        <p>Refund amounts depend on when you cancel:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>More than 24 hours before slot: <strong>100% of advance</strong></li>
          <li>6–24 hours before slot: <strong>50% of advance</strong></li>
          <li>Less than 6 hours before slot: <strong>No refund</strong></li>
        </ul>
        <p>The balance payable at venue is never charged online and is not subject to refund.</p>
      </div>
    </div>
  );
}
