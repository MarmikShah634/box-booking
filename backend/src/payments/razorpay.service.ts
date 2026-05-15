import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../crypto/encryption.service';
import Razorpay from 'razorpay';
import { createHmac } from 'crypto';


@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  private async getClientForOwner(ownerId: string): Promise<Razorpay> {
    const owner = await this.prisma.owner.findUnique({
      where: { id: ownerId },
      select: { razorpayKeyId: true, razorpayKeySecretEnc: true },
    });

    if (!owner) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Owner not found' });
    if (!owner.razorpayKeyId || !owner.razorpayKeySecretEnc) {
      throw new InternalServerErrorException({
        error: 'RAZORPAY_NOT_CONFIGURED',
        message: 'Razorpay keys not configured for this owner',
      });
    }

    const keySecret = this.encryption.decrypt(owner.razorpayKeySecretEnc);

    return new Razorpay({
      key_id: owner.razorpayKeyId,
      key_secret: keySecret,
    });
  }

  async createOrder(
    ownerId: string,
    amount: number,
    receipt: string,
    notes?: Record<string, string>,
  ): Promise<{ id: string; amount: number; currency: string }> {
    const client = await this.getClientForOwner(ownerId);

    try {
      const order = await client.orders.create({
        amount,
        currency: 'INR',
        receipt,
        notes: notes ?? {},
      });

      return {
        id: order.id,
        amount: typeof order.amount === 'number' ? order.amount : Number(order.amount),
        currency: order.currency,
      };
    } catch (err) {
      this.logger.error('Failed to create Razorpay order', err);
      throw new InternalServerErrorException({ error: 'PAYMENT_ERROR', message: 'Failed to create payment order' });
    }
  }

  async createRefund(
    ownerId: string,
    paymentId: string,
    amount: number,
  ): Promise<{ id: string; amount: number }> {
    const client = await this.getClientForOwner(ownerId);

    try {
      const refund = await client.payments.refund(paymentId, { amount });
      return {
        id: refund.id,
        amount: typeof refund.amount === 'number' ? refund.amount : Number(refund.amount),
      };
    } catch (err) {
      this.logger.error(`Failed to create refund for payment ${paymentId}`, err);
      throw new InternalServerErrorException({ error: 'REFUND_ERROR', message: 'Failed to process refund' });
    }
  }

  async getWebhookSecret(ownerId: string): Promise<string> {
    const owner = await this.prisma.owner.findUnique({
      where: { id: ownerId },
      select: { razorpayWebhookSecretEnc: true },
    });
    if (!owner?.razorpayWebhookSecretEnc) {
      throw new InternalServerErrorException({ error: 'RAZORPAY_NOT_CONFIGURED', message: 'Webhook secret not configured' });
    }
    return this.encryption.decrypt(owner.razorpayWebhookSecretEnc);
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSig = createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      return expectedSig === signature;
    } catch {
      return false;
    }
  }
}
