export const metadata = { title: 'Cancellation Policy — BoxCricket' };
export default function CancellationPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Cancellation Policy</h1>
      <p className="text-zinc-500 text-sm mb-10">Last updated: 1 January 2026</p>
      <div className="text-sm leading-relaxed space-y-4 text-zinc-700 dark:text-zinc-300">
        <p>You can cancel a confirmed booking from your bookings page. Cancellation policies are set per booking at the time of booking.</p>
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="text-left p-4 font-semibold">Time before slot</th>
                <th className="text-right p-4 font-semibold">Refund</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <tr><td className="p-4">More than 24 hours</td><td className="p-4 text-right text-emerald-600 font-semibold">100%</td></tr>
              <tr><td className="p-4">6–24 hours</td><td className="p-4 text-right text-amber-600 font-semibold">50%</td></tr>
              <tr><td className="p-4">Less than 6 hours</td><td className="p-4 text-right text-red-600 font-semibold">0%</td></tr>
            </tbody>
          </table>
        </div>
        <p>Owner-initiated cancellations always result in a 100% refund regardless of timing.</p>
      </div>
    </div>
  );
}
