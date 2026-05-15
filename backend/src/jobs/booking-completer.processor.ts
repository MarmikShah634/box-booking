import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_BOOKING_COMPLETER } from './queues.module';

export interface BookingCompleterJobData {
  bookingId: string;
}

@Processor(QUEUE_BOOKING_COMPLETER)
export class BookingCompleterProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingCompleterProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<BookingCompleterJobData>): Promise<void> {
    const { bookingId } = job.data;

    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      this.logger.warn(`Booking ${bookingId} not found for completion`);
      return;
    }

    if (booking.status !== 'CONFIRMED') {
      this.logger.log(`Booking ${bookingId} already in status ${booking.status} — skipping`);
      return;
    }

    // Only mark complete if slot has passed
    const slotEndAt = new Date(booking.slotStartAt.getTime() + 60 * 60 * 1000); // +1 hour
    if (new Date() < slotEndAt) {
      this.logger.log(`Booking ${bookingId} slot not yet ended — skipping`);
      return;
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'COMPLETED' },
    });

    this.logger.log(`Booking ${bookingId} marked COMPLETED`);
  }
}
