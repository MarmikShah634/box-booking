import { Module, OnModuleInit } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { collectDefaultMetrics } from 'prom-client';

@Module({
  controllers: [MetricsController],
})
export class MetricsModule implements OnModuleInit {
  onModuleInit() {
    collectDefaultMetrics({ prefix: 'boxcricket_' });
  }
}
