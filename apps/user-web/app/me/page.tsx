import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { BookingCard, type Booking } from '@/components/me/BookingCard';
import { api } from '@/lib/api';

interface ApiBooking {
  id: string;
  status: string;
  slotDate: string;
  slotHour: number;
  durationHours: number;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  venue: { name: string; city: string };
  box: { name: string };
}

function hourToLabel(hour: number): string {
  const start = hour % 12 || 12;
  const startAmPm = hour < 12 ? 'AM' : 'PM';
  const end = (hour + 1) % 12 || 12;
  const endAmPm = (hour + 1) < 12 ? 'AM' : 'PM';
  return `${start}:00 ${startAmPm} – ${end}:00 ${endAmPm}`;
}

function toBookingCard(b: ApiBooking): Booking {
  const slotLabel = hourToLabel(b.slotHour);
  const status = (['CONFIRMED', 'PENDING', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] as const).includes(
    b.status as Booking['status'],
  )
    ? (b.status as Booking['status'])
    : 'PENDING';

  return {
    id: b.id,
    venueName: b.venue.name,
    venueCity: b.venue.city,
    boxName: b.box.name,
    date: b.slotDate,
    startTime: `${b.slotHour}:00`,
    endTime: `${b.slotHour + (b.durationHours ?? 1)}:00`,
    slotLabel,
    status,
    totalPaise: b.totalAmount,
    advancePaidPaise: b.advanceAmount,
    balancePaise: b.balanceAmount,
  };
}

async function BookingsList() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await api.get<{ data: ApiBooking[]; hasMore: boolean }>(
    '/bookings/mine?page=1&pageSize=20',
    { serverCookies: cookieHeader },
  );

  const upcomingStatuses = ['CONFIRMED', 'PENDING_PAYMENT', 'PENDING'];
  const pastStatuses = ['COMPLETED', 'CANCELLED', 'REFUNDED', 'NO_SHOW', 'PAYMENT_FAILED'];

  const raw = res.ok ? res.data.data : [];
  const upcoming = raw.filter((b) => upcomingStatuses.includes(b.status)).map(toBookingCard);
  const past = raw.filter((b) => pastStatuses.includes(b.status)).map(toBookingCard);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-zinc-500 text-sm py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
            No upcoming bookings.{' '}
            <a href="/" className="text-emerald-600 hover:underline">Book a turf</a>
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((b) => <BookingCard key={b.id} booking={b} />)}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Past</h2>
          <div className="space-y-3">
            {past.map((b) => <BookingCard key={b.id} booking={b} />)}
          </div>
        </section>
      )}
    </div>
  );
}

export default function MeDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6">
        My bookings
      </h1>
      <Suspense fallback={<div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
      ))}</div>}>
        <BookingsList />
      </Suspense>
    </div>
  );
}
