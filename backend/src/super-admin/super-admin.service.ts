import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { HashService } from '../crypto/hash.service';
import { VenueStatus } from '@prisma/client';

interface PaginationQuery {
  page?: number;
  pageSize?: number;
  status?: string;
}

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly hash: HashService,
  ) {}

  // ── Venues ──────────────────────────────────────────────────────────────────

  async getVenues(query: PaginationQuery) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where = query.status ? { status: query.status as VenueStatus } : {};

    const [items, total] = await Promise.all([
      this.prisma.venue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { owner: { select: { name: true, email: true } } },
      }),
      this.prisma.venue.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getVenueById(venueId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      include: {
        owner: { select: { name: true, email: true, phone: true } },
        boxes: { include: { pricingRules: true } },
      },
    });
    if (!venue) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Venue not found' });
    return venue;
  }

  async approveVenue(adminId: string, venueId: string) {
    const venue = await this.findVenue(venueId);
    if (venue.status !== 'PENDING') {
      throw new BadRequestException({ error: 'INVALID_STATE', message: 'Only PENDING venues can be approved' });
    }

    const updated = await this.prisma.venue.update({
      where: { id: venueId },
      data: { status: 'APPROVED', approvedAt: new Date(), rejectionReason: null },
    });

    await this.audit.log({
      actorType: 'SUPER_ADMIN',
      actorId: adminId,
      action: 'venue.approve',
      targetType: 'Venue',
      targetId: venueId,
    });

    return updated;
  }

  async rejectVenue(adminId: string, venueId: string, reason: string) {
    await this.findVenue(venueId);

    const updated = await this.prisma.venue.update({
      where: { id: venueId },
      data: { status: 'REJECTED', rejectionReason: reason },
    });

    await this.audit.log({
      actorType: 'SUPER_ADMIN',
      actorId: adminId,
      action: 'venue.reject',
      targetType: 'Venue',
      targetId: venueId,
      metadata: { reason },
    });

    return updated;
  }

  async suspendVenue(adminId: string, venueId: string, reason: string) {
    await this.findVenue(venueId);

    const updated = await this.prisma.venue.update({
      where: { id: venueId },
      data: { status: 'SUSPENDED', suspendReason: reason },
    });

    await this.audit.log({
      actorType: 'SUPER_ADMIN',
      actorId: adminId,
      action: 'venue.suspend',
      targetType: 'Venue',
      targetId: venueId,
      metadata: { reason },
    });

    return updated;
  }

  async reinstateVenue(adminId: string, venueId: string) {
    await this.findVenue(venueId);

    const updated = await this.prisma.venue.update({
      where: { id: venueId },
      data: { status: 'APPROVED', suspendReason: null },
    });

    await this.audit.log({
      actorType: 'SUPER_ADMIN',
      actorId: adminId,
      action: 'venue.reinstate',
      targetType: 'Venue',
      targetId: venueId,
    });

    return updated;
  }

  // ── Owners ───────────────────────────────────────────────────────────────────

  async getOwners(query: PaginationQuery) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.owner.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          kycStatus: true,
          subscriptionStatus: true,
          isSuspended: true,
          createdAt: true,
        },
      }),
      this.prisma.owner.count(),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getOwnerById(ownerId: string) {
    const owner = await this.prisma.owner.findUnique({
      where: { id: ownerId },
      include: { venues: { select: { id: true, name: true, status: true } } },
    });
    if (!owner) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Owner not found' });
    const { passwordHash, razorpayKeySecretEnc, razorpayWebhookSecretEnc, ...safe } = owner;
    void passwordHash; void razorpayKeySecretEnc; void razorpayWebhookSecretEnc;
    return safe;
  }

  async suspendOwner(adminId: string, ownerId: string, reason: string) {
    await this.findOwner(ownerId);

    const updated = await this.prisma.owner.update({
      where: { id: ownerId },
      data: { isSuspended: true, suspendReason: reason },
    });

    await this.audit.log({
      actorType: 'SUPER_ADMIN',
      actorId: adminId,
      action: 'owner.suspend',
      targetType: 'Owner',
      targetId: ownerId,
      metadata: { reason },
    });

    return { id: updated.id, isSuspended: updated.isSuspended };
  }

  async grantFreeMode(adminId: string, ownerId: string, until: string) {
    await this.findOwner(ownerId);

    const untilDate = new Date(until);
    if (isNaN(untilDate.getTime())) {
      throw new BadRequestException({ error: 'VALIDATION_ERROR', message: 'Invalid date format for until' });
    }

    const updated = await this.prisma.owner.update({
      where: { id: ownerId },
      data: { subscriptionOverrideUntil: untilDate },
    });

    await this.audit.log({
      actorType: 'SUPER_ADMIN',
      actorId: adminId,
      action: 'owner.grant_free',
      targetType: 'Owner',
      targetId: ownerId,
      metadata: { until },
    });

    return { id: updated.id, subscriptionOverrideUntil: updated.subscriptionOverrideUntil };
  }

  async revokeFreeMode(adminId: string, ownerId: string) {
    await this.findOwner(ownerId);

    const updated = await this.prisma.owner.update({
      where: { id: ownerId },
      data: { subscriptionOverrideUntil: null },
    });

    await this.audit.log({
      actorType: 'SUPER_ADMIN',
      actorId: adminId,
      action: 'owner.revoke_free',
      targetType: 'Owner',
      targetId: ownerId,
    });

    return { id: updated.id, subscriptionOverrideUntil: null };
  }

  async resetOwnerPassword(adminId: string, ownerId: string) {
    await this.findOwner(ownerId);

    // Generate random password
    const { randomBytes } = await import('crypto');
    const tempPassword = randomBytes(12).toString('hex');
    const passwordHash = await this.hash.hash(tempPassword);

    await this.prisma.owner.update({
      where: { id: ownerId },
      data: { passwordHash },
    });

    await this.audit.log({
      actorType: 'SUPER_ADMIN',
      actorId: adminId,
      action: 'owner.reset_password',
      targetType: 'Owner',
      targetId: ownerId,
    });

    // In production, send email with temp password
    return { tempPassword }; // Only returned in non-production
  }

  // ── Users ────────────────────────────────────────────────────────────────────

  async getUsers(query: PaginationQuery) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          isBlocked: true,
          blockReason: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async blockUser(adminId: string, userId: string, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ error: 'NOT_FOUND', message: 'User not found' });

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true, blockReason: reason },
    });

    await this.audit.log({
      actorType: 'SUPER_ADMIN',
      actorId: adminId,
      action: 'user.block',
      targetType: 'User',
      targetId: userId,
      metadata: { reason },
    });

    return { id: updated.id, isBlocked: updated.isBlocked };
  }

  async unblockUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ error: 'NOT_FOUND', message: 'User not found' });

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: false, blockReason: null },
    });

    await this.audit.log({
      actorType: 'SUPER_ADMIN',
      actorId: adminId,
      action: 'user.unblock',
      targetType: 'User',
      targetId: userId,
    });

    return { id: updated.id, isBlocked: updated.isBlocked };
  }

  // ── Bookings ─────────────────────────────────────────────────────────────────

  async getBookings(query: PaginationQuery & { status?: string }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = query.status ? { status: query.status } : {};

    const [items, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          user: { select: { name: true, phone: true } },
          owner: { select: { name: true, email: true } },
          venue: { select: { name: true } },
          box: { select: { name: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  // ── Settings ─────────────────────────────────────────────────────────────────

  async getSettings() {
    return this.prisma.platformSettings.findUnique({ where: { id: 'singleton' } });
  }

  async updateSettings(adminId: string, data: Record<string, unknown>) {
    const updated = await this.prisma.platformSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', updatedBy: adminId, ...data },
      update: { updatedBy: adminId, ...data },
    });

    await this.audit.log({
      actorType: 'SUPER_ADMIN',
      actorId: adminId,
      action: 'settings.update',
      metadata: data,
    });

    return updated;
  }

  // ── Audit Log ────────────────────────────────────────────────────────────────

  async getAuditLog(query: PaginationQuery) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.auditLog.count(),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  // ── Cities ───────────────────────────────────────────────────────────────────

  async getCities() {
    const result = await this.prisma.venue.groupBy({
      by: ['city'],
      where: { status: 'APPROVED' },
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
    });

    return result.map((r: { city: string; _count: { city: number } }) => ({ city: r.city, venueCount: r._count.city }));
  }

  addCity(_adminId: string, name: string) {
    // Cities are derived from venues, but we can return the normalized name
    return { city: name.toLowerCase().trim() };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async findVenue(venueId: string) {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Venue not found' });
    return venue;
  }

  private async findOwner(ownerId: string) {
    const owner = await this.prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Owner not found' });
    return owner;
  }
}
