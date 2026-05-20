import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { register } from 'prom-client';
import { Public } from '../common/decorators/public.decorator';

@Controller('metrics')
export class MetricsController {
  @Public()
  @Get()
  async getMetrics(@Res() res: Response): Promise<void> {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  }
}
