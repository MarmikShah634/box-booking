import {
  Controller,
  Post,
  Param,
  Headers,
  Req,
  BadRequestException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from '../payments/razorpay.service';
import { Public } from '../common/decorators/public.decorator';
import { createHash } from 'crypto';

interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id?: string;
        amount: number;
        status: string;
        notes?: Record<string, string>;
      };
    };
    refund?: {
      entity: {
        id: string;
        payment_id: string;
        amount: number;
        status: string;
      };
    };
  };
}

@Controller('webhooks')
export class RazorpayController {
  private readonly logger = new Logger(RazorpayController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
  ) {}

  @Public()
  @Post('razorpay/:ownerId')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('ownerId') ownerId: string,
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: Request,
  ) {
    // Raw body is needed for signature verification — attached by raw body middleware
    const rawBody: Buffer = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body));
    const rawStr = rawBody.toString('utf8');

    // Verify signature
    let secret: string;
    try {
      secret = await this.razorpay.getWebhookSecret(ownerId);
    } catch {
      this.logger.warn(`Webhook for owner ${ownerId} — no secret configured`);
      throw new BadRequestException({ error: 'WEBHOOK_ERROR', message: 'Webhook not configured' });
    }

    const isValid = this.razorpay.verifyWebhookSignature(rawStr, signature, secret);
    if (!isValid) {
      throw new BadRequestException({ error: 'WEBHOOK_INVALID_SIGNATURE', message: 'Invalid webhook signature' });
    }

    const body = req.body as RazorpayWebhookPayload;
    const eventId = (req.headers['x-razorpay-event-id'] as string) ?? `${body.event}-${Date.now()}`;
    const payloadHash = createHash('sha256').update(rawStr).digest('hex');

    // Idempotency check
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { provider_eventId: { provider: 'razorpay', eventId } },
    });

    if (existing) {
      this.logger.log(`Duplicate webhook event ${eventId} — skipping`);
      return { received: true };
    }

    const webhookEvent = await this.prisma.webhookEvent.create({
      data: {
        provider: 'razorpay',
        eventId,
        eventType: body.event,
        payloadHash,
        status: 'RECEIVED',
      },
    });

    try {
      await this.processEvent(body, ownerId);

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: 'PROCESSED', processedAt: new Date() },
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: 'FAILED', error: errMsg },
      });
      this.logger.error(`Failed to process webhook event ${eventId}`, err);
    }

    return { received: true };
  }

  private async processEvent(body: RazorpayWebhookPayload, ownerId: string): Promise<void> {
    const { event, payload } = body;

    switch (event) {
      case 'payment.captured': {
        const payment = payload.payment?.entity;
        if (!payment) break;
        const orderId = payment.order_id;
        if (!orderId) break;

        await this.prisma.booking.updateMany({
          where: { razorpayOrderId: orderId, ownerId },
          data: {
            razorpayPaymentId: payment.id,
            status: 'CONFIRMED',
          },
        });
        break;
      }

      case 'payment.failed': {
        const payment = payload.payment?.entity;
        if (!payment?.order_id) break;

        await this.prisma.booking.updateMany({
          where: { razorpayOrderId: payment.order_id, ownerId },
          data: { status: 'PAYMENT_FAILED' },
        });
        break;
      }

      case 'refund.processed': {
        const refund = payload.refund?.entity;
        if (!refund) break;

        await this.prisma.booking.updateMany({
          where: { razorpayPaymentId: refund.payment_id, ownerId },
          data: {
            razorpayRefundId: refund.id,
            refundAmount: refund.amount,
            refundProcessedAt: new Date(),
            status: 'REFUNDED',
          },
        });
        break;
      }

      case 'refund.failed': {
        const refund = payload.refund?.entity;
        if (!refund) break;
        this.logger.error(`Refund failed for payment ${refund.payment_id}`);
        break;
      }

      default:
        this.logger.log(`Unhandled webhook event type: ${event}`);
    }
  }
}
