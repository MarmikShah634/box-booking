import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('slots')
export class SlotsController {
  constructor(private readonly svc: SlotsService) {}

  @Public()
  @Get('availability')
  async getAvailability(
    @Query('boxId') boxId?: string,
    @Query('date') date?: string,
  ) {
    if (!boxId) throw new BadRequestException({ error: 'VALIDATION_ERROR', message: 'boxId is required' });
    if (!date) throw new BadRequestException({ error: 'VALIDATION_ERROR', message: 'date is required' });
    return this.svc.getAvailability(boxId, date);
  }
}
