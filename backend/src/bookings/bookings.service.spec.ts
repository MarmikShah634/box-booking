import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { PricingService } from '../pricing/pricing.service';
import type { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import type { Booking } from '@prisma/client';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeService() {
  const mockPrisma = {
    box: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    slotHold: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  const mockPricing = {
    computeSlotPrice: jest.fn(),
  } as unknown as PricingService;

  const mockPlatformSettings = {
    getSettings: jest.fn(),
  } as unknown as PlatformSettingsService;

  const svc = new BookingsService(mockPrisma, mockPricing, mockPlatformSettings);

  return { svc, mockPrisma, mockPricing, mockPlatformSettings };
}

function makeDefaultSettings() {
  return {
    id: 'singleton',
    slotHoldTtlMinutes: 8,
    advancePercent: 30,
    cancelFullRefundHours: 24,
    cancelHalfRefundHours: 12,
    updatedAt: new Date(),
    updatedBy: null,
  };
}

function makeBox(overrides: Record<string, unknown> = {}) {
  return {
    id: 'box-1',
    venueId: 'venue-1',
    isActive: true,
    openingHour: 6,
    closingHour: 22,
    defaultHourlyPrice: 100000,
    pricingRules: [],
    venue: { status: 'APPROVED', ownerId: 'owner-1' },
    ...overrides,
  };
}

function makeHold(overrides: Record<string, unknown> = {}) {
  return {
    id: 'hold-1',
    boxId: 'box-1',
    userId: 'user-1',
    slotDate: new Date('2026-06-01T18:30:00.000Z'), // IST 2026-06-02 midnight
    slotHour: 10,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // expires in 10 min
    box: makeBox(),
    ...overrides,
  };
}

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'booking-1',
    boxId: 'box-1',
    venueId: 'venue-1',
    ownerId: 'owner-1',
    userId: 'user-1',
    slotDate: new Date('2026-06-01T18:30:00.000Z'),
    slotHour: 10,
    slotStartAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
    totalAmount: 100000,
    advanceAmount: 30000,
    balanceAmount: 70000,
    status: 'CONFIRMED',
    cancelledBy: null,
    cancelledAt: null,
    refundAmount: 0,
    pricingSnapshot: {},
    cancellationPolicySnapshot: {},
    paymentId: null,
    razorpayOrderId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Booking;
}

// ── createHold ────────────────────────────────────────────────────────────────

describe('BookingsService.createHold', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws NotFoundException if box not found', async () => {
    const { svc, mockPrisma, mockPlatformSettings } = makeService();
    (mockPlatformSettings.getSettings as jest.Mock).mockResolvedValue(makeDefaultSettings());
    (mockPrisma.box.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(svc.createHold('user-1', 'box-1', '2026-06-02', 10)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException if box is not active', async () => {
    const { svc, mockPrisma, mockPlatformSettings } = makeService();
    (mockPlatformSettings.getSettings as jest.Mock).mockResolvedValue(makeDefaultSettings());
    (mockPrisma.box.findUnique as jest.Mock).mockResolvedValue(makeBox({ isActive: false }));

    await expect(svc.createHold('user-1', 'box-1', '2026-06-02', 10)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException if venue is not APPROVED', async () => {
    const { svc, mockPrisma, mockPlatformSettings } = makeService();
    (mockPlatformSettings.getSettings as jest.Mock).mockResolvedValue(makeDefaultSettings());
    (mockPrisma.box.findUnique as jest.Mock).mockResolvedValue(
      makeBox({ venue: { status: 'PENDING', ownerId: 'owner-1' } }),
    );

    await expect(svc.createHold('user-1', 'box-1', '2026-06-02', 10)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws ConflictException with SLOT_NOT_AVAILABLE if booking already exists', async () => {
    const { svc, mockPrisma, mockPlatformSettings } = makeService();
    (mockPlatformSettings.getSettings as jest.Mock).mockResolvedValue(makeDefaultSettings());
    (mockPrisma.box.findUnique as jest.Mock).mockResolvedValue(makeBox());
    (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(makeBooking({ status: 'CONFIRMED' }));

    await expect(svc.createHold('user-1', 'box-1', '2026-06-02', 10)).rejects.toThrow(
      ConflictException,
    );
  });

  it('throws ConflictException if an active hold already exists for that slot', async () => {
    const { svc, mockPrisma, mockPlatformSettings } = makeService();
    (mockPlatformSettings.getSettings as jest.Mock).mockResolvedValue(makeDefaultSettings());
    (mockPrisma.box.findUnique as jest.Mock).mockResolvedValue(makeBox());
    (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.slotHold.findFirst as jest.Mock).mockResolvedValue({
      id: 'hold-99',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await expect(svc.createHold('user-1', 'box-1', '2026-06-02', 10)).rejects.toThrow(
      ConflictException,
    );
  });

  it('creates and returns a hold when slot is available', async () => {
    const { svc, mockPrisma, mockPlatformSettings } = makeService();
    (mockPlatformSettings.getSettings as jest.Mock).mockResolvedValue(makeDefaultSettings());
    (mockPrisma.box.findUnique as jest.Mock).mockResolvedValue(makeBox());
    (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.slotHold.findFirst as jest.Mock).mockResolvedValue(null);

    const expectedHold = makeHold();
    (mockPrisma.slotHold.create as jest.Mock).mockResolvedValue(expectedHold);

    const result = await svc.createHold('user-1', 'box-1', '2026-06-02', 10);

    expect(mockPrisma.slotHold.create).toHaveBeenCalled();
    expect(result).toEqual(expectedHold);
  });

  it('sets expiresAt using slotHoldTtlMinutes from platform settings', async () => {
    const { svc, mockPrisma, mockPlatformSettings } = makeService();
    const settings = makeDefaultSettings();
    settings.slotHoldTtlMinutes = 15;
    (mockPlatformSettings.getSettings as jest.Mock).mockResolvedValue(settings);
    (mockPrisma.box.findUnique as jest.Mock).mockResolvedValue(makeBox());
    (mockPrisma.booking.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.slotHold.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.slotHold.create as jest.Mock).mockImplementation(
      (args: { data: { expiresAt: Date } }) => Promise.resolve({ ...makeHold(), expiresAt: args.data.expiresAt }),
    );

    const before = Date.now();
    await svc.createHold('user-1', 'box-1', '2026-06-02', 10);
    const after = Date.now();

    const createArgs = (mockPrisma.slotHold.create as jest.Mock).mock.calls[0][0] as {
      data: { expiresAt: Date };
    };
    const expiresAtMs = createArgs.data.expiresAt.getTime();
    expect(expiresAtMs).toBeGreaterThanOrEqual(before + 15 * 60 * 1000);
    expect(expiresAtMs).toBeLessThanOrEqual(after + 15 * 60 * 1000);
  });
});

// ── deleteHold ────────────────────────────────────────────────────────────────

describe('BookingsService.deleteHold', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws NotFoundException if hold not found', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.slotHold.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(svc.deleteHold('user-1', 'hold-1')).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if hold belongs to different user', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.slotHold.findUnique as jest.Mock).mockResolvedValue({
      id: 'hold-1',
      userId: 'other-user',
    });

    await expect(svc.deleteHold('user-1', 'hold-1')).rejects.toThrow(ForbiddenException);
  });

  it('deletes hold when user matches', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.slotHold.findUnique as jest.Mock).mockResolvedValue({ id: 'hold-1', userId: 'user-1' });
    (mockPrisma.slotHold.delete as jest.Mock).mockResolvedValue({});

    await svc.deleteHold('user-1', 'hold-1');

    expect(mockPrisma.slotHold.delete).toHaveBeenCalledWith({ where: { id: 'hold-1' } });
  });
});

// ── initiateBooking ───────────────────────────────────────────────────────────

describe('BookingsService.initiateBooking', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws NotFoundException if hold not found', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.slotHold.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(svc.initiateBooking('user-1', 'hold-1')).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if hold belongs to different user', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.slotHold.findUnique as jest.Mock).mockResolvedValue(makeHold({ userId: 'other-user' }));

    await expect(svc.initiateBooking('user-1', 'hold-1')).rejects.toThrow(ForbiddenException);
  });

  it('throws HOLD_EXPIRED if hold expiresAt is in the past', async () => {
    const { svc, mockPrisma } = makeService();
    const expiredHold = makeHold({ expiresAt: new Date(Date.now() - 1000) });
    (mockPrisma.slotHold.findUnique as jest.Mock).mockResolvedValue(expiredHold);

    try {
      await svc.initiateBooking('user-1', 'hold-1');
    } catch (e) {
      const ex = e as BadRequestException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('HOLD_EXPIRED');
    }
  });

  it('creates a PENDING_PAYMENT booking via transaction on valid hold', async () => {
    const { svc, mockPrisma, mockPricing, mockPlatformSettings } = makeService();
    const hold = makeHold();
    (mockPrisma.slotHold.findUnique as jest.Mock).mockResolvedValue(hold);
    (mockPlatformSettings.getSettings as jest.Mock).mockResolvedValue(makeDefaultSettings());
    (mockPricing.computeSlotPrice as jest.Mock).mockReturnValue({
      total: 100000,
      advance: 30000,
      breakdown: [{ hour: 10, dayType: 'WEEKDAY', ruleApplied: 'DEFAULT', price: 100000 }],
    });

    const createdBooking = makeBooking({ status: 'PENDING_PAYMENT' });
    (mockPrisma.$transaction as jest.Mock).mockImplementation(
      async (fn: (tx: typeof mockPrisma) => Promise<Booking>) => {
        const fakeTx = {
          slotHold: { delete: jest.fn().mockResolvedValue({}) },
          box: { findUniqueOrThrow: jest.fn().mockResolvedValue({ venueId: 'venue-1' }) },
          booking: { create: jest.fn().mockResolvedValue(createdBooking) },
        };
        return fn(fakeTx as unknown as typeof mockPrisma);
      },
    );

    const result = await svc.initiateBooking('user-1', 'hold-1');

    expect(result.status).toBe('PENDING_PAYMENT');
  });
});

// ── getMyBookings ─────────────────────────────────────────────────────────────

describe('BookingsService.getMyBookings', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated list of bookings for the user', async () => {
    const { svc, mockPrisma } = makeService();
    const bookings = [makeBooking(), makeBooking({ id: 'booking-2' })];
    (mockPrisma.booking.findMany as jest.Mock).mockResolvedValue(bookings);
    (mockPrisma.booking.count as jest.Mock).mockResolvedValue(2);

    const result = await svc.getMyBookings('user-1', { page: 1, pageSize: 20 });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
  });

  it('queries with userId filter', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.booking.count as jest.Mock).mockResolvedValue(0);

    await svc.getMyBookings('user-99', {});

    const findManyCall = (mockPrisma.booking.findMany as jest.Mock).mock.calls[0][0] as {
      where: { userId: string };
    };
    expect(findManyCall.where.userId).toBe('user-99');
  });

  it('defaults to page 1 and pageSize 20 when not provided', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.booking.count as jest.Mock).mockResolvedValue(0);

    const result = await svc.getMyBookings('user-1', {});

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it('calculates totalPages correctly', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.booking.count as jest.Mock).mockResolvedValue(45);

    const result = await svc.getMyBookings('user-1', { page: 1, pageSize: 20 });

    expect(result.totalPages).toBe(3);
  });
});

// ── getBookingById ────────────────────────────────────────────────────────────

describe('BookingsService.getBookingById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws NotFoundException if booking not found', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(svc.getBookingById('user-1', 'booking-1')).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if booking belongs to different user', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(
      makeBooking({ userId: 'other-user' }),
    );

    await expect(svc.getBookingById('user-1', 'booking-1')).rejects.toThrow(ForbiddenException);
  });

  it('returns booking when user matches', async () => {
    const { svc, mockPrisma } = makeService();
    const booking = makeBooking();
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(booking);

    const result = await svc.getBookingById('user-1', 'booking-1');
    expect(result).toEqual(booking);
  });
});

// ── cancelBooking ─────────────────────────────────────────────────────────────

describe('BookingsService.cancelBooking', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws NotFoundException if booking not found', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(svc.cancelBooking('user-1', 'booking-1')).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if booking belongs to different user', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(
      makeBooking({ userId: 'other-user' }),
    );

    await expect(svc.cancelBooking('user-1', 'booking-1')).rejects.toThrow(ForbiddenException);
  });

  it('throws INVALID_STATE if booking is already CANCELLED', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(
      makeBooking({ status: 'CANCELLED' }),
    );

    try {
      await svc.cancelBooking('user-1', 'booking-1');
    } catch (e) {
      const ex = e as BadRequestException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('INVALID_STATE');
    }
  });

  it('throws INVALID_STATE if booking is COMPLETED', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(
      makeBooking({ status: 'COMPLETED' }),
    );

    await expect(svc.cancelBooking('user-1', 'booking-1')).rejects.toThrow(BadRequestException);
  });

  it('grants full refund when cancelling with more than cancelFullRefundHours remaining', async () => {
    const { svc, mockPrisma, mockPlatformSettings } = makeService();
    const slotStartAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(
      makeBooking({ slotStartAt, advanceAmount: 30000, status: 'CONFIRMED' }),
    );
    (mockPlatformSettings.getSettings as jest.Mock).mockResolvedValue(makeDefaultSettings()); // cancelFullRefundHours = 24
    (mockPrisma.booking.update as jest.Mock).mockResolvedValue(makeBooking({ status: 'CANCELLED', refundAmount: 30000 }));

    await svc.cancelBooking('user-1', 'booking-1');

    const updateCall = (mockPrisma.booking.update as jest.Mock).mock.calls[0][0] as {
      data: { refundAmount: number };
    };
    expect(updateCall.data.refundAmount).toBe(30000);
  });

  it('grants half refund when cancelling within half-refund window', async () => {
    const { svc, mockPrisma, mockPlatformSettings } = makeService();
    const slotStartAt = new Date(Date.now() + 18 * 60 * 60 * 1000); // 18 hours from now (between 12 and 24)
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(
      makeBooking({ slotStartAt, advanceAmount: 30000, status: 'CONFIRMED' }),
    );
    (mockPlatformSettings.getSettings as jest.Mock).mockResolvedValue(makeDefaultSettings());
    (mockPrisma.booking.update as jest.Mock).mockResolvedValue(makeBooking({ status: 'CANCELLED', refundAmount: 15000 }));

    await svc.cancelBooking('user-1', 'booking-1');

    const updateCall = (mockPrisma.booking.update as jest.Mock).mock.calls[0][0] as {
      data: { refundAmount: number };
    };
    expect(updateCall.data.refundAmount).toBe(15000);
  });

  it('grants no refund when cancelling inside the half-refund cutoff', async () => {
    const { svc, mockPrisma, mockPlatformSettings } = makeService();
    const slotStartAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // only 6 hours away
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(
      makeBooking({ slotStartAt, advanceAmount: 30000, status: 'CONFIRMED' }),
    );
    (mockPlatformSettings.getSettings as jest.Mock).mockResolvedValue(makeDefaultSettings());
    (mockPrisma.booking.update as jest.Mock).mockResolvedValue(makeBooking({ status: 'CANCELLED', refundAmount: 0 }));

    await svc.cancelBooking('user-1', 'booking-1');

    const updateCall = (mockPrisma.booking.update as jest.Mock).mock.calls[0][0] as {
      data: { refundAmount: number };
    };
    expect(updateCall.data.refundAmount).toBe(0);
  });

  it('sets status to CANCELLED and cancelledBy to USER', async () => {
    const { svc, mockPrisma, mockPlatformSettings } = makeService();
    const slotStartAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(
      makeBooking({ slotStartAt, status: 'CONFIRMED' }),
    );
    (mockPlatformSettings.getSettings as jest.Mock).mockResolvedValue(makeDefaultSettings());
    (mockPrisma.booking.update as jest.Mock).mockResolvedValue(makeBooking({ status: 'CANCELLED' }));

    await svc.cancelBooking('user-1', 'booking-1');

    const updateCall = (mockPrisma.booking.update as jest.Mock).mock.calls[0][0] as {
      data: { status: string; cancelledBy: string };
    };
    expect(updateCall.data.status).toBe('CANCELLED');
    expect(updateCall.data.cancelledBy).toBe('USER');
  });
});

// ── markNoShow ────────────────────────────────────────────────────────────────

describe('BookingsService.markNoShow', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws NotFoundException if booking not found', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(svc.markNoShow('owner-1', 'booking-1')).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if booking belongs to different owner', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(
      makeBooking({ ownerId: 'other-owner' }),
    );

    await expect(svc.markNoShow('owner-1', 'booking-1')).rejects.toThrow(ForbiddenException);
  });

  it('throws INVALID_STATE if booking is not CONFIRMED', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(
      makeBooking({ status: 'PENDING_PAYMENT' }),
    );

    try {
      await svc.markNoShow('owner-1', 'booking-1');
    } catch (e) {
      const ex = e as BadRequestException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('INVALID_STATE');
    }
  });

  it('throws TOO_EARLY if called before 30 minutes after slot start', async () => {
    const { svc, mockPrisma } = makeService();
    const slotStartAt = new Date(Date.now() - 10 * 60 * 1000); // slot started 10 min ago
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(
      makeBooking({ slotStartAt, status: 'CONFIRMED' }),
    );

    try {
      await svc.markNoShow('owner-1', 'booking-1');
    } catch (e) {
      const ex = e as BadRequestException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('TOO_EARLY');
    }
  });

  it('updates booking to NO_SHOW when 30+ minutes after slot start', async () => {
    const { svc, mockPrisma } = makeService();
    const slotStartAt = new Date(Date.now() - 35 * 60 * 1000); // slot started 35 min ago
    (mockPrisma.booking.findUnique as jest.Mock).mockResolvedValue(
      makeBooking({ slotStartAt, status: 'CONFIRMED' }),
    );
    (mockPrisma.booking.update as jest.Mock).mockResolvedValue(makeBooking({ status: 'NO_SHOW' }));

    await svc.markNoShow('owner-1', 'booking-1');

    const updateCall = (mockPrisma.booking.update as jest.Mock).mock.calls[0][0] as {
      data: { status: string };
    };
    expect(updateCall.data.status).toBe('NO_SHOW');
  });
});
