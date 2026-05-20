import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_HOLD_SWEEPER } from './queues.module';

export interface HoldSweeperJobData {
  holdId?: string; // if specified, sweeps single hold; otherwise sweeps all expired
}

@Processor(QUEUE_HOLD_SWEEPER)
export class HoldSweeperProcessor extends WorkerHost {
  private readonly logger = new Logger(HoldSweeperProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<HoldSweeperJobData>): Promise<void> {
    const { holdId } = job.data;

    if (holdId) {
      await this.prisma.slotHold.deleteMany({
        where: { id: holdId, expiresAt: { lte: new Date() } },
      });
      this.logger.log(`Swept hold ${holdId}`);
    } else {
      const result = await this.prisma.slotHold.deleteMany({
        where: { expiresAt: { lte: new Date() } },
      });
      this.logger.log(`Swept ${result.count} expired holds`);
    }
  }
}
