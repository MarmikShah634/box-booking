import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { istDateToUtcMidnight, slotStartAtUtc } from '../common/utils/time';
import { Booking, Prisma } from '@prisma/client';


interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

const HOLD_TTL_DEFAULT_MINUTES = 8;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
    private readonly platformSettings: PlatformSettingsService,
  ) {}

  async createHold(userId: string, boxId: string, slotDate: string, slotHour: number) {
    const settings = await this.platformSettings.getSettings();
    const ttlMinutes = settings.slotHoldTtlMinutes ?? HOLD_TTL_DEFAULT_MINUTES;

    const box = await this.prisma.box.findUnique({
      where: { id: boxId },
      include: {
        pricingRules: true,
        venue: { select: { status: true } },
      },
    });
    if (!box) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Box not found' });
    if (!box.isActive) throw new BadRequestException({ error: 'SLOT_NOT_AVAILABLE', message: 'Box is not active' });
    if (box.venue.status !== 'APPROVED') {
      throw new BadRequestException({ error: 'SLOT_NOT_AVAILABLE', message: 'Venue not available' });
    }

    const slotDateUtc = istDateToUtcMidnight(slotDate);

    // Check for existing booking
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        boxId,
        slotDate: slotDateUtc,
        slotHour,
        status: { in: ['CONFIRMED', 'COMPLETED', 'PENDING_PAYMENT'] },
      },
    });
    if (existingBooking) {
      throw new ConflictException({ error: 'SLOT_NOT_AVAILABLE', message: 'Slot already booked' });
    }

    // Check existing hold
    const existingHold = await this.prisma.slotHold.findFirst({
      where: {
        boxId,
        slotDate: slotDateUtc,
        slotHour,
        expiresAt: { gt: new Date() },
      },
    });
    if (existingHold) {
      throw new ConflictException({ error: 'SLOT_NOT_AVAILABLE', message: 'Slot already held' });
    }

    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    try {
      const hold = await this.prisma.slotHold.create({
        data: {
          boxId,
          slotDate: slotDateUtc,
          slotHour,
          userId,
          expiresAt,
        },
      });
      return hold;
    } catch {
      throw new ConflictException({ error: 'SLOT_NOT_AVAILABLE', message: 'Slot not available' });
    }
  }

  async deleteHold(userId: string, holdId: string): Promise<void> {
    const hold = await this.prisma.slotHold.findUnique({ where: { id: holdId } });
    if (!hold) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Hold not found' });
    if (hold.userId !== userId) throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Not your hold' });
    await this.prisma.slotHold.delete({ where: { id: holdId } });
  }

  async initiateBooking(userId: string, holdId: string) {
    const hold = await this.prisma.slotHold.findUnique({
      where: { id: holdId },
      include: {
        box: {
          include: {
            pricingRules: true,
            venue: { select: { ownerId: true, status: true } },
          },
        },
      },
    });

    if (!hold) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Hold not found' });
    if (hold.userId !== userId) throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Not your hold' });
    if (hold.expiresAt < new Date()) {
      throw new BadRequestException({ error: 'HOLD_EXPIRED', message: 'Hold has expired' });
    }

    const settings = await this.platformSettings.getSettings();
    const box = hold.box;

    const slotDateStr = hold.slotDate.toISOString().split('T')[0];
    const { total, advance, breakdown } = this.pricing.computeSlotPrice(
      {
        defaultHourlyPrice: box.defaultHourlyPrice,
        pricingRules: box.pricingRules,
        openingHour: box.openingHour,
        closingHour: box.closingHour,
      },
      hold.slotDate,
      hold.slotHour,
      settings.advancePercent,
    );

    const slotStartAt = slotStartAtUtc(slotDateStr, hold.slotHour);

    const booking = await this.prisma.$transaction(async (tx) => {
      // Delete hold
      await tx.slotHold.delete({ where: { id: holdId } });

      return tx.booking.create({
        data: {
          boxId: hold.boxId,
          venueId: (
            await tx.box.findUniqueOrThrow({
              where: { id: hold.boxId },
              select: { venueId: true },
            })
          ).venueId,
          ownerId: box.venue.ownerId,
          userId,
          slotDate: hold.slotDate,
          slotHour: hold.slotHour,
          slotStartAt,
          totalAmount: total,
          advanceAmount: advance,
          balanceAmount: total - advance,
          status: 'PENDING_PAYMENT',
          pricingSnapshot: { breakdown, dayType: breakdown[0]?.dayType } as unknown as Prisma.InputJsonValue,
          cancellationPolicySnapshot: {
            fullRefundHours: settings.cancelFullRefundHours,
            halfRefundHours: settings.cancelHalfRefundHours,
          },
        },
      });
    });

    return booking;
  }

  async getMyBookings(userId: string, query: PaginationQuery) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          box: { select: { name: true } },
          venue: { select: { name: true, city: true, slug: true } },
        },
      }),
      this.prisma.booking.count({ where: { userId } }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getBookingById(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        box: { select: { name: true, surfaceType: true } },
        venue: { select: { name: true, address: true, city: true } },
        review: true,
        invoice: true,
      },
    });

    if (!booking) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Booking not found' });
    if (booking.userId !== userId) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Not your booking' });
    }

    return booking;
  }

  async cancelBooking(userId: string, bookingId: string) {
    const booking = await this.findBookingForUser(userId, bookingId);

    if (!['CONFIRMED', 'PENDING_PAYMENT'].includes(booking.status)) {
      throw new BadRequestException({ error: 'INVALID_STATE', message: 'Booking cannot be cancelled in current state' });
    }

    const settings = await this.platformSettings.getSettings();
    const hoursUntilSlot = (booking.slotStartAt.getTime() - Date.now()) / (60 * 60 * 1000);
    let refundAmount = 0;

    if (hoursUntilSlot >= settings.cancelFullRefundHours) {
      refundAmount = booking.advanceAmount;
    } else if (hoursUntilSlot >= settings.cancelHalfRefundHours) {
      refundAmount = Math.floor(booking.advanceAmount / 2);
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledBy: 'USER',
        cancelledAt: new Date(),
        refundAmount,
      },
    });
  }

  async markNoShow(ownerId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Booking not found' });
    if (booking.ownerId !== ownerId) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Not your booking' });
    }

    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException({ error: 'INVALID_STATE', message: 'Booking must be CONFIRMED to mark no-show' });
    }

    const minNoShowTime = new Date(booking.slotStartAt.getTime() + 30 * 60 * 1000);
    if (new Date() < minNoShowTime) {
      throw new BadRequestException({
        error: 'TOO_EARLY',
        message: 'Cannot mark no-show until 30 minutes after slot start',
      });
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'NO_SHOW' },
    });
  }

  private async findBookingForUser(userId: string, bookingId: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Booking not found' });
    if (booking.userId !== userId) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Not your booking' });
    }
    return booking;
  }
}
