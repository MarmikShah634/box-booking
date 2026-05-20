import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Ensures the authenticated owner owns the venue specified by :venueId in the route params.
 */
@Injectable()
export class OwnerOwnsVenueGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{
      user?: { sub?: string };
      params?: { venueId?: string };
    }>();
    const ownerId = req.user?.sub;
    const venueId = req.params?.venueId;

    if (!ownerId || !venueId) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Missing owner or venue context' });
    }

    const venue = await this.prisma.venue.findUnique({ where: { id: venueId }, select: { ownerId: true } });
    if (!venue) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Venue not found' });
    }
    if (venue.ownerId !== ownerId) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'You do not own this venue' });
    }

    return true;
  }
}

/**
 * Ensures the authenticated owner owns the box specified by :id or :boxId in the route params.
 */
@Injectable()
export class OwnerOwnsBoxGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{
      user?: { sub?: string };
      params?: { id?: string; boxId?: string };
    }>();
    const ownerId = req.user?.sub;
    const boxId = req.params?.id ?? req.params?.boxId;

    if (!ownerId || !boxId) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Missing owner or box context' });
    }

    const box = await this.prisma.box.findUnique({
      where: { id: boxId },
      select: { venue: { select: { ownerId: true } } },
    });
    if (!box) {
      throw new NotFoundException({ error: 'NOT_FOUND', message: 'Box not found' });
    }
    if (box.venue.ownerId !== ownerId) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'You do not own this box' });
    }

    return true;
  }
}
