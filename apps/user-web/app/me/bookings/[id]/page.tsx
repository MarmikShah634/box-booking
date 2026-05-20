import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { paiseToRupees } from '@/lib/currency';
import { formatDatetime } from '@/lib/time';
import { BookingActions } from '@/components/me/BookingActions';

interface BookingDetail {
  id: string;
  status: string;
  slotDate: string;
  slotHour: number;
  durationHours: number;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  slotStartAt: string;
  cancellationPolicySnapshot: { fullRefundHours: number; halfRefundHours: number };
  venue: { name: string; address: string; city: string };
  box: { name: string };
  invoice?: { id: string };
  review?: { id: string };
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const res = await api.get<BookingDetail>(`/bookings/${id}`, {
    serverCookies: cookieStore.toString(),
  });
  if (!res.ok) notFound();

  const booking = res.data;
  const now = Date.now();
  const slotMs = new Date(booking.slotStartAt).getTime();
  const hoursUntil = (slotMs - now) / 3600000;
  const canCancel = booking.status === 'CONFIRMED' && slotMs > now;
  const canReview = booking.status === 'COMPLETED' && !booking.review;

  const refundPaise =
    hoursUntil > booking.cancellationPolicySnapshot.fullRefundHours
      ? booking.advanceAmount
      : hoursUntil > booking.cancellationPolicySnapshot.halfRefundHours
      ? Math.ceil(booking.advanceAmount / 2)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <a href="/me" className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1 mb-4">
          ← Back to bookings
        </a>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          {booking.venue.name} — {booking.box.name}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">{booking.venue.address}</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-zinc-500">Date & time</div>
            <div className="font-medium text-zinc-900 dark:text-white mt-1">
              {formatDatetime(booking.slotStartAt)}
            </div>
          </div>
          <div>
            <div className="text-zinc-500">Status</div>
            <div className="font-medium mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                booking.status === 'COMPLETED' ? 'bg-zinc-100 text-zinc-600' :
                booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>{booking.status}</span>
            </div>
          </div>
          <div>
            <div className="text-zinc-500">Advance paid</div>
            <div className="font-medium text-zinc-900 dark:text-white mt-1">{paiseToRupees(booking.advanceAmount)}</div>
          </div>
          <div>
            <div className="text-zinc-500">Balance at venue</div>
            <div className="font-medium text-zinc-900 dark:text-white mt-1">{paiseToRupees(booking.balanceAmount)}</div>
          </div>
        </div>
      </div>

      <BookingActions
        bookingId={booking.id}
        canCancel={canCancel}
        canReview={canReview}
        refundPaise={refundPaise}
        invoiceId={booking.invoice?.id}
      />
    </div>
  );
}
