import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Venue, VenueStatus } from '@prisma/client';

type Amenity = 'parking' | 'washroom' | 'floodlight' | 'cafeteria' | 'equipment' | 'seating' | 'drinking_water' | 'first_aid';

interface CreateVenueDto {
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  geoLat?: number;
  geoLng?: number;
  amenities: Amenity[];
}

interface PublicListQuery {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  pageSize?: number;
}

function generateSlug(name: string, city: string): string {
  const namePart = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const cityPart = city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const hash = Date.now().toString(36);
  return `${namePart}-${cityPart}-${hash}`;
}

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateVenueDto): Promise<Venue> {
    const slug = generateSlug(dto.name, dto.city);
    return this.prisma.venue.create({
      data: {
        ownerId,
        slug,
        name: dto.name,
        description: dto.description,
        address: dto.address,
        city: dto.city.toLowerCase(),
        state: dto.state,
        pincode: dto.pincode,
        geoLat: dto.geoLat,
        geoLng: dto.geoLng,
        amenities: dto.amenities,
        status: 'DRAFT',
      },
    });
  }

  async getMyVenues(ownerId: string): Promise<Venue[]> {
    return this.prisma.venue.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPublicList(query: PublicListQuery) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const amenitiesFilter = query.amenities
      ? query.amenities.split(',').map((a) => a.trim())
      : undefined;

    const where = {
      status: VenueStatus.APPROVED,
      ...(query.city && { city: query.city.toLowerCase() }),
      ...(amenitiesFilter && { amenities: { hasEvery: amenitiesFilter } }),
    };

    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (query.sort === 'newest') orderBy = { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.venue.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          boxes: {
            where: { isActive: true },
            select: { defaultHourlyPrice: true },
            take: 1,
            orderBy: { defaultHourlyPrice: 'asc' },
          },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.venue.count({ where }),
    ]);

    // Filter by price if needed (post-filter since price is on boxes)
    let filteredItems = items;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filteredItems = items.filter((v: typeof items[0]) => {
        const price = v.boxes[0]?.defaultHourlyPrice;
        if (price === undefined) return false;
        if (query.minPrice !== undefined && price < query.minPrice) return false;
        if (query.maxPrice !== undefined && price > query.maxPrice) return false;
        return true;
      });
    }

    return { items: filteredItems, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getPublicDetail(slug: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { slug },
      include: {
        boxes: {
          where: { isActive: true },
          include: { pricingRules: true },
        },
        _count: { select: { reviews: true } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (venue?.status !== 'APPROVED') {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Venue not found' });
    }

    return venue;
  }

  async getById(ownerId: string, venueId: string): Promise<Venue> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      include: { boxes: { include: { pricingRules: true, blackouts: true } } },
    });
    if (!venue) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Venue not found' });
    if (venue.ownerId !== ownerId)
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'You do not own this venue' });
    return venue;
  }

  async update(ownerId: string, venueId: string, dto: Partial<CreateVenueDto>): Promise<Venue> {
    const venue = await this.findAndAssertOwner(ownerId, venueId);

    if (venue.status === 'APPROVED' || venue.status === 'SUSPENDED') {
      // Only certain fields editable after approval
    }

    return this.prisma.venue.update({
      where: { id: venueId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city.toLowerCase() }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.pincode !== undefined && { pincode: dto.pincode }),
        ...(dto.geoLat !== undefined && { geoLat: dto.geoLat }),
        ...(dto.geoLng !== undefined && { geoLng: dto.geoLng }),
        ...(dto.amenities !== undefined && { amenities: dto.amenities }),
      },
    });
  }

  async remove(ownerId: string, venueId: string): Promise<void> {
    await this.findAndAssertOwner(ownerId, venueId);
    await this.prisma.venue.delete({ where: { id: venueId } });
  }

  async addPhotos(ownerId: string, venueId: string, keys: string[]): Promise<Venue> {
    const venue = await this.findAndAssertOwner(ownerId, venueId);
    return this.prisma.venue.update({
      where: { id: venueId },
      data: { photos: [...venue.photos, ...keys] },
    });
  }

  async submit(ownerId: string, venueId: string): Promise<Venue> {
    const venue = await this.findAndAssertOwner(ownerId, venueId);
    if (venue.status !== 'DRAFT') {
      throw new BadRequestException({ error: 'INVALID_STATE', message: 'Only DRAFT venues can be submitted' });
    }
    return this.prisma.venue.update({
      where: { id: venueId },
      data: { status: 'PENDING' },
    });
  }

  private async findAndAssertOwner(ownerId: string, venueId: string): Promise<Venue> {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Venue not found' });
    if (venue.ownerId !== ownerId)
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'You do not own this venue' });
    return venue;
  }
}
