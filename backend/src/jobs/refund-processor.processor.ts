import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from '../payments/razorpay.service';
import { QUEUE_REFUND } from './queues.module';

export interface RefundJobData {
  bookingId: string;
  paymentId: string;
  ownerId: string;
  amount: number;
}

@Processor(QUEUE_REFUND)
export class RefundProcessor extends WorkerHost {
  private readonly logger = new Logger(RefundProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
  ) {
    super();
  }

  async process(job: Job<RefundJobData>): Promise<void> {
    const { bookingId, paymentId, ownerId, amount } = job.data;

    try {
      const refund = await this.razorpay.createRefund(ownerId, paymentId, amount);

      await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          razorpayRefundId: refund.id,
          refundAmount: refund.amount,
          refundProcessedAt: new Date(),
          status: 'REFUNDED',
        },
      });

      this.logger.log(`Refund ${refund.id} processed for booking ${bookingId}`);
    } catch (err) {
      this.logger.error(`Failed to process refund for booking ${bookingId}`, err);
      throw err; // BullMQ will retry
    }
  }
}
