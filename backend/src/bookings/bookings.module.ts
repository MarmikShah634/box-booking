import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';

@Module({
  imports: [PlatformSettingsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
