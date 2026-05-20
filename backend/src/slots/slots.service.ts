import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { istDateToUtcMidnight, nowIst } from '../common/utils/time';

type SlotStatus = 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLACKOUT' | 'PAST' | 'CLOSED';

export interface SlotResult {
  hour: number;
  status: SlotStatus;
  priceInPaise: number;
}

@Injectable()
export class SlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
    private readonly platformSettings: PlatformSettingsService,
  ) {}

  async getAvailability(boxId: string, dateStr: string): Promise<SlotResult[]> {
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new BadRequestException({ error: 'VALIDATION_ERROR', message: 'date must be YYYY-MM-DD' });
    }

    const box = await this.prisma.box.findUnique({
      where: { id: boxId },
      include: {
        pricingRules: true,
        blackouts: true,
        venue: { select: { status: true } },
      },
    });

    if (!box) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Box not found' });
    if (!box.isActive || box.venue.status !== 'APPROVED') {
      return [];
    }

    const slotDate = istDateToUtcMidnight(dateStr);
    const now = nowIst();
    const [year, month, day] = dateStr.split('-').map(Number);
    const slotDateObj = new Date(year, month - 1, day); // local date for weekday computation

    // Get weekday for blackout check (0=Sun)
    const weekday = slotDateObj.getDay();

    // Fetch holds and bookings for this date
    const [holds, bookings] = await Promise.all([
      this.prisma.slotHold.findMany({
        where: {
          boxId,
          slotDate,
          expiresAt: { gt: new Date() },
        },
        select: { slotHour: true },
      }),
      this.prisma.booking.findMany({
        where: {
          boxId,
          slotDate,
          status: { in: ['CONFIRMED', 'COMPLETED', 'PENDING_PAYMENT'] },
        },
        select: { slotHour: true },
      }),
    ]);

    const heldHours = new Set(holds.map((h: { slotHour: number }) => h.slotHour));
    const bookedHours = new Set(bookings.map((b: { slotHour: number }) => b.slotHour));

    // Check if entire date is blacked out
    const dateBlackout = box.blackouts.some(
      (b: { type: string; date: Date | null; weekday: number | null }) =>
        b.type === 'ONE_OFF' &&
        b.date &&
        new Date(b.date).toDateString() === slotDateObj.toDateString(),
    );
    const recurringBlackout = box.blackouts.some(
      (b: { type: string; weekday: number | null }) => b.type === 'RECURRING_WEEKLY' && b.weekday === weekday,
    );
    const entireDayBlackout = dateBlackout || recurringBlackout;

    const settings = await this.platformSettings.getSettings();
    const advancePercent = settings.advancePercent;

    const slots: SlotResult[] = [];

    for (let hour = box.openingHour; hour < box.closingHour; hour++) {
      // Build IST datetime for this slot to check if PAST
      const istSlotMs =
        slotDate.getTime() + (5.5 * 60 + hour * 60) * 60 * 1000;
      const slotIst = new Date(istSlotMs);

      let status: SlotStatus;

      if (slotIst < now) {
        status = 'PAST';
      } else if (entireDayBlackout) {
        status = 'BLACKOUT';
      } else if (bookedHours.has(hour)) {
        status = 'BOOKED';
      } else if (heldHours.has(hour)) {
        status = 'HELD';
      } else {
        status = 'AVAILABLE';
      }

      const { total } = this.pricing.computeSlotPrice(
        {
          defaultHourlyPrice: box.defaultHourlyPrice,
          pricingRules: box.pricingRules,
          openingHour: box.openingHour,
          closingHour: box.closingHour,
        },
        slotDate,
        hour,
        advancePercent,
      );

      slots.push({ hour, status, priceInPaise: total });
    }

    return slots;
  }
}
