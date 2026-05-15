import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HoldSweeperProcessor } from './hold-sweeper.processor';
import { BookingCompleterProcessor } from './booking-completer.processor';
import { RefundProcessor } from './refund-processor.processor';
import { InvoiceGeneratorProcessor } from './invoice-generator.processor';
import { NotificationDispatcherProcessor } from './notification-dispatcher.processor';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

export const QUEUE_HOLD_SWEEPER = 'hold-sweeper';
export const QUEUE_BOOKING_COMPLETER = 'booking-completer';
export const QUEUE_REFUND = 'refund';
export const QUEUE_INVOICE = 'invoice';
export const QUEUE_NOTIFICATION = 'notification';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.getOrThrow<string>('REDIS_URL'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUE_HOLD_SWEEPER },
      { name: QUEUE_BOOKING_COMPLETER },
      { name: QUEUE_REFUND },
      { name: QUEUE_INVOICE },
      { name: QUEUE_NOTIFICATION },
    ),
    PaymentsModule,
    NotificationsModule,
  ],
  providers: [
    HoldSweeperProcessor,
    BookingCompleterProcessor,
    RefundProcessor,
    InvoiceGeneratorProcessor,
    NotificationDispatcherProcessor,
  ],
  exports: [BullModule],
})
export class QueuesModule {}
