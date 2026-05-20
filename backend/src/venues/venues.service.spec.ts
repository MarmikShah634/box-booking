import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { VenuesService } from './venues.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { Venue } from '@prisma/client';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeService() {
  const mockPrisma = {
    venue: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  } as unknown as PrismaService;

  const svc = new VenuesService(mockPrisma);

  return { svc, mockPrisma };
}

function makeVenue(overrides: Partial<Venue> = {}): Venue {
  return {
    id: 'venue-1',
    ownerId: 'owner-1',
    slug: 'test-venue-mumbai-abc123',
    name: 'Test Venue',
    description: null,
    address: '123 Main St',
    city: 'mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    geoLat: null,
    geoLng: null,
    amenities: [],
    photos: [],
    status: 'DRAFT',
    isSuspended: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Venue;
}

// ── create ────────────────────────────────────────────────────────────────────

describe('VenuesService.create', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a venue with DRAFT status', async () => {
    const { svc, mockPrisma } = makeService();
    const createdVenue = makeVenue();
    (mockPrisma.venue.create as jest.Mock).mockResolvedValue(createdVenue);

    const result = await svc.create('owner-1', {
      name: 'Test Venue',
      address: '123 Main St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      amenities: [],
    });

    const createCall = (mockPrisma.venue.create as jest.Mock).mock.calls[0][0] as {
      data: { status: string; ownerId: string };
    };
    expect(createCall.data.status).toBe('DRAFT');
    expect(createCall.data.ownerId).toBe('owner-1');
    expect(result).toEqual(createdVenue);
  });

  it('lowercases city when creating venue', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.venue.create as jest.Mock).mockResolvedValue(makeVenue());

    await svc.create('owner-1', {
      name: 'Test Venue',
      address: '123 Main St',
      city: 'MUMBAI',
      state: 'Maharashtra',
      pincode: '400001',
      amenities: [],
    });

    const createCall = (mockPrisma.venue.create as jest.Mock).mock.calls[0][0] as {
      data: { city: string };
    };
    expect(createCall.data.city).toBe('mumbai');
  });

  it('generates a slug from name and city', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.venue.create as jest.Mock).mockResolvedValue(makeVenue());

    await svc.create('owner-1', {
      name: 'My Sports Arena',
      address: '123 Main St',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      amenities: [],
    });

    const createCall = (mockPrisma.venue.create as jest.Mock).mock.calls[0][0] as {
      data: { slug: string };
    };
    expect(createCall.data.slug).toMatch(/^my-sports-arena-delhi-/);
  });
});

// ── getMyVenues ───────────────────────────────────────────────────────────────

describe('VenuesService.getMyVenues', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns venues filtered by ownerId', async () => {
    const { svc, mockPrisma } = makeService();
    const venues = [makeVenue(), makeVenue({ id: 'venue-2' })];
    (mockPrisma.venue.findMany as jest.Mock).mockResolvedValue(venues);

    const result = await svc.getMyVenues('owner-1');

    const findManyCall = (mockPrisma.venue.findMany as jest.Mock).mock.calls[0][0] as {
      where: { ownerId: string };
    };
    expect(findManyCall.where.ownerId).toBe('owner-1');
    expect(result).toEqual(venues);
  });
});

// ── getPublicList ─────────────────────────────────────────────────────────────

describe('VenuesService.getPublicList', () => {
  beforeEach(() => jest.clearAllMocks());

  it('only queries for APPROVED venues', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.venue.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.venue.count as jest.Mock).mockResolvedValue(0);

    await svc.getPublicList({});

    const findManyCall = (mockPrisma.venue.findMany as jest.Mock).mock.calls[0][0] as {
      where: { status: string };
    };
    expect(findManyCall.where.status).toBe('APPROVED');
  });

  it('filters by city when city is provided', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.venue.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.venue.count as jest.Mock).mockResolvedValue(0);

    await svc.getPublicList({ city: 'Mumbai' });

    const findManyCall = (mockPrisma.venue.findMany as jest.Mock).mock.calls[0][0] as {
      where: { city: string };
    };
    expect(findManyCall.where.city).toBe('mumbai');
  });

  it('does not include city filter when city is not provided', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.venue.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.venue.count as jest.Mock).mockResolvedValue(0);

    await svc.getPublicList({});

    const findManyCall = (mockPrisma.venue.findMany as jest.Mock).mock.calls[0][0] as {
      where: Record<string, unknown>;
    };
    expect(findManyCall.where['city']).toBeUndefined();
  });

  it('returns paginated results', async () => {
    const { svc, mockPrisma } = makeService();
    const venues = [makeVenue({ status: 'APPROVED' })];
    (mockPrisma.venue.findMany as jest.Mock).mockResolvedValue(venues);
    (mockPrisma.venue.count as jest.Mock).mockResolvedValue(1);

    const result = await svc.getPublicList({ page: 1, pageSize: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
  });

  it('filters by minPrice if provided (post-filter)', async () => {
    const { svc, mockPrisma } = makeService();
    const venues = [
      { ...makeVenue(), boxes: [{ defaultHourlyPrice: 50000 }], _count: { reviews: 0 } },
      { ...makeVenue({ id: 'venue-2' }), boxes: [{ defaultHourlyPrice: 150000 }], _count: { reviews: 0 } },
    ];
    (mockPrisma.venue.findMany as jest.Mock).mockResolvedValue(venues);
    (mockPrisma.venue.count as jest.Mock).mockResolvedValue(2);

    const result = await svc.getPublicList({ minPrice: 100000 });

    expect(result.items).toHaveLength(1);
    expect((result.items[0]).boxes[0].defaultHourlyPrice).toBe(150000);
  });

  it('filters by maxPrice if provided (post-filter)', async () => {
    const { svc, mockPrisma } = makeService();
    const venues = [
      { ...makeVenue(), boxes: [{ defaultHourlyPrice: 50000 }], _count: { reviews: 0 } },
      { ...makeVenue({ id: 'venue-2' }), boxes: [{ defaultHourlyPrice: 150000 }], _count: { reviews: 0 } },
    ];
    (mockPrisma.venue.findMany as jest.Mock).mockResolvedValue(venues);
    (mockPrisma.venue.count as jest.Mock).mockResolvedValue(2);

    const result = await svc.getPublicList({ maxPrice: 100000 });

    expect(result.items).toHaveLength(1);
    expect((result.items[0]).boxes[0].defaultHourlyPrice).toBe(50000);
  });

  it('excludes venues with no boxes from price-filtered results', async () => {
    const { svc, mockPrisma } = makeService();
    const venues = [
      { ...makeVenue(), boxes: [], _count: { reviews: 0 } },
    ];
    (mockPrisma.venue.findMany as jest.Mock).mockResolvedValue(venues);
    (mockPrisma.venue.count as jest.Mock).mockResolvedValue(1);

    const result = await svc.getPublicList({ minPrice: 10000 });

    expect(result.items).toHaveLength(0);
  });
});

// ── getPublicDetail ───────────────────────────────────────────────────────────

describe('VenuesService.getPublicDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws NotFoundException if venue not found', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.venue.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(svc.getPublicDetail('missing-slug')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException if venue is not APPROVED', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.venue.findUnique as jest.Mock).mockResolvedValue(makeVenue({ status: 'PENDING' }));

    await expect(svc.getPublicDetail('test-slug')).rejects.toThrow(NotFoundException);
  });

  it('returns venue if status is APPROVED', async () => {
    const { svc, mockPrisma } = makeService();
    const venue = makeVenue({ status: 'APPROVED' });
    (mockPrisma.venue.findUnique as jest.Mock).mockResolvedValue(venue);

    const result = await svc.getPublicDetail('test-slug');
    expect(result).toEqual(venue);
  });
});

// ── getById (owner) ───────────────────────────────────────────────────────────

describe('VenuesService.getById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws NotFoundException if venue not found', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.venue.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(svc.getById('owner-1', 'venue-1')).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if venue belongs to different owner', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.venue.findUnique as jest.Mock).mockResolvedValue(makeVenue({ ownerId: 'other-owner' }));

    await expect(svc.getById('owner-1', 'venue-1')).rejects.toThrow(ForbiddenException);
  });

  it('returns venue when owner matches', async () => {
    const { svc, mockPrisma } = makeService();
    const venue = makeVenue();
    (mockPrisma.venue.findUnique as jest.Mock).mockResolvedValue(venue);

    const result = await svc.getById('owner-1', 'venue-1');
    expect(result).toEqual(venue);
  });
});

// ── submit ────────────────────────────────────────────────────────────────────

describe('VenuesService.submit', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws NotFoundException if venue not found', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.venue.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(svc.submit('owner-1', 'venue-1')).rejects.toThrow(NotFoundException);
  });

  it('throws INVALID_STATE if venue is not in DRAFT status', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.venue.findUnique as jest.Mock).mockResolvedValue(makeVenue({ status: 'PENDING' }));

    try {
      await svc.submit('owner-1', 'venue-1');
    } catch (e) {
      const ex = e as BadRequestException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('INVALID_STATE');
    }
  });

  it('updates status to PENDING on submit', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.venue.findUnique as jest.Mock).mockResolvedValue(makeVenue({ status: 'DRAFT' }));
    (mockPrisma.venue.update as jest.Mock).mockResolvedValue(makeVenue({ status: 'PENDING' }));

    await svc.submit('owner-1', 'venue-1');

    const updateCall = (mockPrisma.venue.update as jest.Mock).mock.calls[0][0] as {
      data: { status: string };
    };
    expect(updateCall.data.status).toBe('PENDING');
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe('VenuesService.update', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws ForbiddenException if owner does not match', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.venue.findUnique as jest.Mock).mockResolvedValue(makeVenue({ ownerId: 'other-owner' }));

    await expect(svc.update('owner-1', 'venue-1', { name: 'New Name' })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('updates only provided fields', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.venue.findUnique as jest.Mock).mockResolvedValue(makeVenue());
    (mockPrisma.venue.update as jest.Mock).mockResolvedValue(makeVenue({ name: 'Updated Name' }));

    await svc.update('owner-1', 'venue-1', { name: 'Updated Name' });

    const updateCall = (mockPrisma.venue.update as jest.Mock).mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(updateCall.data['name']).toBe('Updated Name');
    expect(updateCall.data['status']).toBeUndefined();
  });
});

// ── remove ────────────────────────────────────────────────────────────────────

describe('VenuesService.remove', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws ForbiddenException if owner does not match', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.venue.findUnique as jest.Mock).mockResolvedValue(makeVenue({ ownerId: 'other-owner' }));

    await expect(svc.remove('owner-1', 'venue-1')).rejects.toThrow(ForbiddenException);
  });

  it('deletes venue when owner matches', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.venue.findUnique as jest.Mock).mockResolvedValue(makeVenue());
    (mockPrisma.venue.delete as jest.Mock).mockResolvedValue({});

    await svc.remove('owner-1', 'venue-1');

    expect(mockPrisma.venue.delete).toHaveBeenCalledWith({ where: { id: 'venue-1' } });
  });
});
