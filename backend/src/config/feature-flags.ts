import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly config: ConfigService) {}

  get isPlatformFreeMode(): boolean {
    return this.config.get<string>('PLATFORM_FREE_MODE') === 'true';
  }

  get freeModeReason(): string | undefined {
    return this.config.get<string>('PLATFORM_FREE_MODE_REASON');
  }
}
