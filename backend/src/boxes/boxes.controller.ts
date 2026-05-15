import {
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { z } from 'zod';
import { BoxesService } from './boxes.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentOwner } from '../common/decorators/current-owner.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

const SurfaceTypeEnum = z.enum(['TURF', 'MAT', 'CONCRETE', 'OTHER']);
const DayTypeEnum = z.enum(['WEEKDAY', 'WEEKEND']);
const BlackoutTypeEnum = z.enum(['ONE_OFF', 'RECURRING_WEEKLY']);

const CreateBoxSchema = z.object({
  name: z.string().min(1).max(100),
  surfaceType: SurfaceTypeEnum.optional(),
  defaultHourlyPrice: z.number().int().positive(),
  openingHour: z.number().int().min(0).max(23),
  closingHour: z.number().int().min(1).max(24),
});

const UpdateBoxSchema = CreateBoxSchema.partial();

const PricingRuleSchema = z.object({
  dayType: DayTypeEnum,
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(1).max(24),
  price: z.number().int().positive(),
});

const BlackoutSchema = z.object({
  type: BlackoutTypeEnum,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  weekday: z.number().int().min(0).max(6).optional(),
  reason: z.string().optional(),
});

@Controller()
@Roles('owner')
export class BoxesController {
  constructor(private readonly svc: BoxesService) {}

  // Venue-scoped box routes
  @Post('venues/:venueId/boxes')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentOwner() payload: JwtPayload,
    @Param('venueId') venueId: string,
    @Body(new ZodValidationPipe(CreateBoxSchema)) body: z.infer<typeof CreateBoxSchema>,
  ) {
    return this.svc.create(payload.sub, venueId, body);
  }

  @Get('venues/:venueId/boxes')
  async listByVenue(
    @CurrentOwner() payload: JwtPayload,
    @Param('venueId') venueId: string,
  ) {
    return this.svc.listByVenue(payload.sub, venueId);
  }

  // Box-level routes
  @Get('boxes/:id')
  async getById(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Patch('boxes/:id')
  async update(
    @CurrentOwner() payload: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateBoxSchema)) body: z.infer<typeof UpdateBoxSchema>,
  ) {
    return this.svc.update(payload.sub, id, body);
  }

  @Delete('boxes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentOwner() payload: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.svc.remove(payload.sub, id);
  }

  @Put('boxes/:id/pricing-rules')
  async replacePricingRules(
    @CurrentOwner() payload: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(z.array(PricingRuleSchema))) rules: z.infer<typeof PricingRuleSchema>[],
  ) {
    return this.svc.replacePricingRules(payload.sub, id, rules);
  }

  @Get('boxes/:id/blackouts')
  async getBlackouts(@CurrentOwner() payload: JwtPayload, @Param('id') id: string) {
    return this.svc.getBlackouts(payload.sub, id);
  }

  @Post('boxes/:id/blackouts')
  @HttpCode(HttpStatus.CREATED)
  async createBlackout(
    @CurrentOwner() payload: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(BlackoutSchema)) body: z.infer<typeof BlackoutSchema>,
  ) {
    return this.svc.createBlackout(payload.sub, id, body);
  }

  @Delete('blackouts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlackout(@CurrentOwner() payload: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.svc.deleteBlackout(payload.sub, id);
  }
}
