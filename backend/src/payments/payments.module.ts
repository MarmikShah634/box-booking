import { Module } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { CryptoModule } from '../crypto/crypto.module';

@Module({
  imports: [CryptoModule],
  providers: [RazorpayService],
  exports: [RazorpayService],
})
export class PaymentsModule {}
