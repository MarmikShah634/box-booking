import { Module } from '@nestjs/common';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';

@Module({
  imports: [PlatformSettingsModule],
  controllers: [SlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
