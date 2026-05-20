import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { z } from 'zod';
import { BookingsService } from './bookings.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOwner } from '../common/decorators/current-owner.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

const CreateHoldSchema = z.object({
  boxId: z.string().min(1),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotHour: z.number().int().min(0).max(23),
});

const InitiateSchema = z.object({
  holdId: z.string().min(1),
});

@Controller('bookings')
export class BookingsController {
  constructor(private readonly svc: BookingsService) {}

  @Roles('user')
  @Post('holds')
  @HttpCode(HttpStatus.CREATED)
  async createHold(
    @CurrentUser() payload: JwtPayload,
    @Body(new ZodValidationPipe(CreateHoldSchema)) body: z.infer<typeof CreateHoldSchema>,
  ) {
    return this.svc.createHold(payload.sub, body.boxId, body.slotDate, body.slotHour);
  }

  @Roles('user')
  @Delete('holds/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteHold(@CurrentUser() payload: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.svc.deleteHold(payload.sub, id);
  }

  @Roles('user')
  @Post('initiate')
  async initiateBooking(
    @CurrentUser() payload: JwtPayload,
    @Body(new ZodValidationPipe(InitiateSchema)) body: z.infer<typeof InitiateSchema>,
  ) {
    return this.svc.initiateBooking(payload.sub, body.holdId);
  }

  @Roles('user')
  @Get('mine')
  async getMyBookings(
    @CurrentUser() payload: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.svc.getMyBookings(payload.sub, { page, pageSize });
  }

  @Roles('user')
  @Get(':id')
  async getById(@CurrentUser() payload: JwtPayload, @Param('id') id: string) {
    return this.svc.getBookingById(payload.sub, id);
  }

  @Roles('user')
  @Post(':id/cancel')
  async cancel(@CurrentUser() payload: JwtPayload, @Param('id') id: string) {
    return this.svc.cancelBooking(payload.sub, id);
  }

  @Roles('owner')
  @Post(':id/no-show')
  async noShow(@CurrentOwner() payload: JwtPayload, @Param('id') id: string) {
    return this.svc.markNoShow(payload.sub, id);
  }
}
