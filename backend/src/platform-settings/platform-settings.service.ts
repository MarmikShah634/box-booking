import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformSettings } from '@prisma/client';

@Injectable()
export class PlatformSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<PlatformSettings> {
    const settings =
      (await this.prisma.platformSettings.findUnique({ where: { id: 'singleton' } })) ??
      (await this.prisma.platformSettings.create({ data: { id: 'singleton' } }));
    return settings;
  }

  async updateSettings(
    data: Partial<Omit<PlatformSettings, 'id' | 'updatedAt'>>,
    updatedBy: string,
  ): Promise<PlatformSettings> {
    return this.prisma.platformSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', updatedBy, ...data },
      update: { updatedBy, ...data },
    });
  }
}
