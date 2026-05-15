import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { FreeModeService } from './free-mode.service';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';

@Module({
  imports: [PlatformSettingsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, FreeModeService],
  exports: [SubscriptionsService, FreeModeService],
})
export class SubscriptionsModule {}
