import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { configuration } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { CryptoModule } from './crypto/crypto.module';
import { UserAuthModule } from './auth/user-auth/user-auth.module';
import { OwnerAuthModule } from './auth/owner-auth/owner-auth.module';
import { SuperAdminAuthModule } from './auth/super-admin-auth/super-admin-auth.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { OwnersModule } from './owners/owners.module';
import { VenuesModule } from './venues/venues.module';
import { BoxesModule } from './boxes/boxes.module';
import { SlotsModule } from './slots/slots.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ReviewsModule } from './reviews/reviews.module';
import { InvoicesModule } from './invoices/invoices.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { StorageModule } from './storage/storage.module';
import { NotificationsModule } from './notifications/notifications.module';
import { QueuesModule } from './jobs/queues.module';
import { PlatformSettingsModule } from './platform-settings/platform-settings.module';
import { AuditModule } from './audit/audit.module';
import { MetricsModule } from './metrics/metrics.module';
import { PricingModule } from './pricing/pricing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      cache: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.otp',
            'req.body.keySecret',
            'req.body.webhookSecret',
          ],
          remove: true,
        },
        customProps: (req) => ({ requestId: (req as unknown as Record<string, unknown>)['requestId'] }),
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
      },
    }),
    // Core / infrastructure
    PrismaModule,
    RedisModule,
    CryptoModule,
    NotificationsModule,
    PricingModule,
    AuditModule,
    PlatformSettingsModule,
    StorageModule,
    MetricsModule,

    // Auth
    UserAuthModule,
    OwnerAuthModule,
    SuperAdminAuthModule,

    // Feature modules
    OwnersModule,
    VenuesModule,
    BoxesModule,
    SlotsModule,
    BookingsModule,
    PaymentsModule,
    WebhooksModule,
    ReviewsModule,
    InvoicesModule,
    SubscriptionsModule,
    SuperAdminModule,

    // Async jobs
    QueuesModule,

    // Health
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
