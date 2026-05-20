import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const REVIEW_WINDOW_DAYS = 30;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(userId: string, bookingId: string, rating: number, text?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });

    if (!booking) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Booking not found' });
    if (booking.userId !== userId) throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Not your booking' });
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException({ error: 'INVALID_STATE', message: 'Can only review completed bookings' });
    }
    if (booking.review) {
      throw new ConflictException({ error: 'ALREADY_REVIEWED', message: 'Already reviewed this booking' });
    }

    const daysSinceSlot = (Date.now() - booking.slotStartAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceSlot > REVIEW_WINDOW_DAYS) {
      throw new BadRequestException({ error: 'REVIEW_WINDOW_CLOSED', message: 'Review window of 30 days has passed' });
    }

    return this.prisma.review.create({
      data: {
        bookingId,
        venueId: booking.venueId,
        userId,
        rating,
        text,
      },
    });
  }

  async replyToReview(ownerId: string, reviewId: string, ownerReply: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { venue: { select: { ownerId: true } } },
    });

    if (!review) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Review not found' });
    if (review.venue.ownerId !== ownerId) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Not your venue' });
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { ownerReply, ownerRepliedAt: new Date() },
    });
  }

  async getVenueReviews(slug: string, page: number, pageSize: number) {
    const venue = await this.prisma.venue.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!venue) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Venue not found' });

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { venueId: venue.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { user: { select: { name: true } } },
      }),
      this.prisma.review.count({ where: { venueId: venue.id } }),
    ]);

    const avgRating =
      items.length > 0
        ? items.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / items.length
        : null;

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize), avgRating };
  }
}
