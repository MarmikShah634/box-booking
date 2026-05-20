import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FreeModeService } from './free-mode.service';
import { SubscriptionPlanCode } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly freeMode: FreeModeService,
  ) {}

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany();
  }

  async getMySubscription(ownerId: string) {
    const [owner, subscriptions, isFreeMode] = await Promise.all([
      this.prisma.owner.findUnique({
        where: { id: ownerId },
        select: {
          subscriptionStatus: true,
          subscriptionOverrideUntil: true,
        },
      }),
      this.prisma.subscription.findMany({
        where: { ownerId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.freeMode.isFreeModeActive(ownerId),
    ]);

    if (!owner) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Owner not found' });

    return {
      subscriptionStatus: owner.subscriptionStatus,
      subscriptionOverrideUntil: owner.subscriptionOverrideUntil,
      isFreeMode,
      history: subscriptions,
    };
  }

  async subscribe(ownerId: string, planCode: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: planCode as SubscriptionPlanCode },
    });

    if (!plan) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Plan not found' });

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = await this.prisma.subscription.create({
      data: {
        ownerId,
        planCode: planCode as SubscriptionPlanCode,
        periodStart: now,
        periodEnd,
        status: 'ACTIVE',
      },
    });

    await this.prisma.owner.update({
      where: { id: ownerId },
      data: { subscriptionStatus: 'ACTIVE' },
    });

    return subscription;
  }

  async cancel(ownerId: string) {
    const active = await this.prisma.subscription.findFirst({
      where: { ownerId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!active) {
      throw new BadRequestException({ error: 'NO_ACTIVE_SUBSCRIPTION', message: 'No active subscription to cancel' });
    }

    await this.prisma.subscription.update({
      where: { id: active.id },
      data: { status: 'CANCELLED' },
    });

    await this.prisma.owner.update({
      where: { id: ownerId },
      data: { subscriptionStatus: 'CANCELLED' },
    });

    return { cancelled: true };
  }
}
