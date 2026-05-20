import { Module } from '@nestjs/common';
import { RazorpayController } from './razorpay.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [RazorpayController],
})
export class WebhooksModule {}
