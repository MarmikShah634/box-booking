import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService, PricingRuleInput } from '../pricing/pricing.service';
import { Box, Blackout, BlackoutType, SurfaceType, DayType } from '@prisma/client';

interface CreateBoxDto {
  name: string;
  surfaceType?: SurfaceType;
  defaultHourlyPrice: number;
  openingHour: number;
  closingHour: number;
}

interface PricingRuleDto {
  dayType: DayType;
  startHour: number;
  endHour: number;
  price: number;
}

interface BlackoutDto {
  type: BlackoutType;
  date?: string; // ISO date YYYY-MM-DD for ONE_OFF
  weekday?: number; // 0-6 for RECURRING_WEEKLY
  reason?: string;
}

@Injectable()
export class BoxesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
  ) {}

  async create(ownerId: string, venueId: string, dto: CreateBoxDto): Promise<Box> {
    await this.assertOwnsVenue(ownerId, venueId);

    return this.prisma.box.create({
      data: {
        venueId,
        name: dto.name,
        surfaceType: dto.surfaceType ?? 'TURF',
        defaultHourlyPrice: dto.defaultHourlyPrice,
        openingHour: dto.openingHour,
        closingHour: dto.closingHour,
      },
    });
  }

  async listByVenue(ownerId: string, venueId: string) {
    await this.assertOwnsVenue(ownerId, venueId);

    return this.prisma.box.findMany({
      where: { venueId },
      include: { pricingRules: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getById(boxId: string) {
    const box = await this.prisma.box.findUnique({
      where: { id: boxId },
      include: { pricingRules: true, venue: { select: { name: true, ownerId: true } } },
    });
    if (!box) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Box not found' });
    return box;
  }

  async update(ownerId: string, boxId: string, dto: Partial<CreateBoxDto>): Promise<Box> {
    await this.assertOwnsBox(ownerId, boxId);

    return this.prisma.box.update({
      where: { id: boxId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.surfaceType !== undefined && { surfaceType: dto.surfaceType }),
        ...(dto.defaultHourlyPrice !== undefined && { defaultHourlyPrice: dto.defaultHourlyPrice }),
        ...(dto.openingHour !== undefined && { openingHour: dto.openingHour }),
        ...(dto.closingHour !== undefined && { closingHour: dto.closingHour }),
      },
    });
  }

  async remove(ownerId: string, boxId: string): Promise<void> {
    await this.assertOwnsBox(ownerId, boxId);
    await this.prisma.box.delete({ where: { id: boxId } });
  }

  async replacePricingRules(ownerId: string, boxId: string, rules: PricingRuleDto[]) {
    const box = await this.assertOwnsBox(ownerId, boxId);

    // Validate full coverage
    const ruleInputs: PricingRuleInput[] = rules.map((r) => ({
      dayType: r.dayType,
      startHour: r.startHour,
      endHour: r.endHour,
      price: r.price,
    }));

    const { valid, missingHours } = this.pricing.validateFullCoverage(
      ruleInputs,
      box.openingHour,
      box.closingHour,
    );

    if (!valid) {
      throw new BadRequestException({
        error: 'INCOMPLETE_PRICING',
        message: 'Pricing rules do not cover all hours',
        missingHours,
      });
    }

    await this.prisma.$transaction([
      this.prisma.pricingRule.deleteMany({ where: { boxId } }),
      this.prisma.pricingRule.createMany({
        data: rules.map((r) => ({ boxId, ...r })),
      }),
    ]);

    return this.prisma.pricingRule.findMany({ where: { boxId } });
  }

  async getBlackouts(ownerId: string, boxId: string): Promise<Blackout[]> {
    await this.assertOwnsBox(ownerId, boxId);
    return this.prisma.blackout.findMany({ where: { boxId } });
  }

  async createBlackout(ownerId: string, boxId: string, dto: BlackoutDto): Promise<Blackout> {
    await this.assertOwnsBox(ownerId, boxId);

    if (dto.type === 'ONE_OFF' && !dto.date) {
      throw new BadRequestException({ error: 'VALIDATION_ERROR', message: 'date required for ONE_OFF blackout' });
    }
    if (dto.type === 'RECURRING_WEEKLY' && dto.weekday === undefined) {
      throw new BadRequestException({ error: 'VALIDATION_ERROR', message: 'weekday required for RECURRING_WEEKLY blackout' });
    }

    return this.prisma.blackout.create({
      data: {
        boxId,
        type: dto.type,
        date: dto.date ? new Date(dto.date) : undefined,
        weekday: dto.weekday,
        reason: dto.reason,
      },
    });
  }

  async deleteBlackout(ownerId: string, blackoutId: string): Promise<void> {
    const blackout = await this.prisma.blackout.findUnique({
      where: { id: blackoutId },
      include: { box: { include: { venue: { select: { ownerId: true } } } } },
    });
    if (!blackout) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Blackout not found' });
    if (blackout.box.venue.ownerId !== ownerId) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Not your blackout' });
    }
    await this.prisma.blackout.delete({ where: { id: blackoutId } });
  }

  private async assertOwnsVenue(ownerId: string, venueId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { ownerId: true },
    });
    if (!venue) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Venue not found' });
    if (venue.ownerId !== ownerId)
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'You do not own this venue' });
    return venue;
  }

  private async assertOwnsBox(ownerId: string, boxId: string) {
    const box = await this.prisma.box.findUnique({
      where: { id: boxId },
      include: { venue: { select: { ownerId: true } } },
    });
    if (!box) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Box not found' });
    if (box.venue.ownerId !== ownerId)
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'You do not own this box' });
    return box;
  }
}
