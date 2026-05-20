import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../crypto/encryption.service';
import { Owner } from '@prisma/client';

interface UpdateProfileDto {
  name?: string;
  phone?: string;
}

interface KycDto {
  gstin?: string;
  pan?: string;
  bankAccountHolderName: string;
  bankAccountNumber: string;
  bankIfsc: string;
}

interface RazorpayKeysDto {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

function redactOwner(owner: Owner) {
  const { passwordHash, razorpayKeySecretEnc, razorpayWebhookSecretEnc, bankAccountNumberEnc, ...safe } = owner;
  // suppress unused-variable warnings
  void passwordHash; void razorpayKeySecretEnc; void razorpayWebhookSecretEnc; void bankAccountNumberEnc;
  // Mask bank account number - show last 4 chars only
  const maskedBank = owner.bankAccountNumberEnc ? '****' : null;
  return { ...safe, bankAccountNumberMasked: maskedBank };
}

@Injectable()
export class OwnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  async getProfile(ownerId: string) {
    const owner = await this.findOwnerOrThrow(ownerId);
    return redactOwner(owner);
  }

  async updateProfile(ownerId: string, dto: UpdateProfileDto) {
    await this.findOwnerOrThrow(ownerId);
    const owner = await this.prisma.owner.update({
      where: { id: ownerId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
    });
    return redactOwner(owner);
  }

  async updateKyc(ownerId: string, dto: KycDto) {
    await this.findOwnerOrThrow(ownerId);

    const bankAccountNumberEnc = this.encryption.encrypt(dto.bankAccountNumber);

    const owner = await this.prisma.owner.update({
      where: { id: ownerId },
      data: {
        gstin: dto.gstin,
        pan: dto.pan,
        bankAccountHolderName: dto.bankAccountHolderName,
        bankAccountNumberEnc,
        bankIfsc: dto.bankIfsc,
        kycStatus: 'SUBMITTED',
      },
    });
    return redactOwner(owner);
  }

  async updateRazorpayKeys(ownerId: string, dto: RazorpayKeysDto) {
    await this.findOwnerOrThrow(ownerId);

    await this.prisma.owner.update({
      where: { id: ownerId },
      data: {
        razorpayKeyId: dto.keyId,
        razorpayKeySecretEnc: this.encryption.encrypt(dto.keySecret),
        razorpayWebhookSecretEnc: this.encryption.encrypt(dto.webhookSecret),
      },
    });

    return { updated: true };
  }

  async getRazorpayKeysStatus(ownerId: string) {
    const owner = await this.findOwnerOrThrow(ownerId);
    return {
      hasKeyId: Boolean(owner.razorpayKeyId),
      hasKeySecret: Boolean(owner.razorpayKeySecretEnc),
      hasWebhookSecret: Boolean(owner.razorpayWebhookSecretEnc),
      keyId: owner.razorpayKeyId ?? null,
    };
  }

  async getDashboard(ownerId: string) {
    await this.findOwnerOrThrow(ownerId);

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setUTCDate(endOfToday.getUTCDate() + 1);

    const startOfWeek = new Date(now);
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - 7);

    const [todayBookings, weekBookings, recentBookings] = await Promise.all([
      this.prisma.booking.count({
        where: {
          ownerId,
          slotStartAt: { gte: startOfToday, lt: endOfToday },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
      }),
      this.prisma.booking.findMany({
        where: {
          ownerId,
          slotStartAt: { gte: startOfWeek },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
        select: { totalAmount: true, slotStartAt: true },
      }),
      this.prisma.booking.findMany({
        where: { ownerId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true, phone: true } }, box: { select: { name: true } } },
      }),
    ]);

    const weekRevenue = weekBookings.reduce((sum: number, b: { totalAmount: number }) => sum + b.totalAmount, 0);

    // Simple occupancy: bookings / (max possible slots in week)
    const venues = await this.prisma.venue.count({ where: { ownerId, status: 'APPROVED' } });
    const boxes = await this.prisma.box.count({
      where: { venue: { ownerId }, isActive: true },
    });
    const maxSlots = boxes * 7 * 14; // rough: 14 hours/day * 7 days * boxes
    const occupancyPct = maxSlots > 0 ? Math.round((weekBookings.length / maxSlots) * 100) : 0;

    return {
      todayBookings,
      weekRevenue,
      occupancyPct,
      venues,
      boxes,
      recentBookings,
    };
  }

  async getBookings(ownerId: string, query: PaginationQuery) {
    await this.findOwnerOrThrow(ownerId);

    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: { ownerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          user: { select: { name: true, phone: true } },
          box: { select: { name: true } },
          venue: { select: { name: true } },
        },
      }),
      this.prisma.booking.count({ where: { ownerId } }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  private async findOwnerOrThrow(ownerId: string): Promise<Owner> {
    const owner = await this.prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Owner not found' });
    return owner;
  }
}
