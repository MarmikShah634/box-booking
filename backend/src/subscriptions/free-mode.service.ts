import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';

@Injectable()
export class FreeModeService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly platformSettings: PlatformSettingsService,
  ) {}

  async isFreeModeActive(ownerId?: string): Promise<boolean> {
    // 1. Env var takes highest precedence
    if (this.config.get<string>('PLATFORM_FREE_MODE') === 'true') {
      return true;
    }

    // 2. DB override for platform-wide free mode
    const settings = await this.platformSettings.getSettings();
    if (settings.freeModeDbOverride) {
      return true;
    }

    // 3. Per-owner subscription override
    if (ownerId) {
      const owner = await this.prisma.owner.findUnique({
        where: { id: ownerId },
        select: { subscriptionOverrideUntil: true },
      });
      if (owner?.subscriptionOverrideUntil && owner.subscriptionOverrideUntil > new Date()) {
        return true;
      }
    }

    return false;
  }
}
