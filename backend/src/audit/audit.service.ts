import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActorType, Prisma } from '@prisma/client';

interface AuditLogParams {
  actorType: ActorType;
  actorId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorType: params.actorType,
        actorId: params.actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });
  }
}
