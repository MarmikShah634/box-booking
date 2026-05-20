import {
  Controller,
  Get,
  Patch,
  Put,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { z } from 'zod';
import { OwnersService } from './owners.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentOwner } from '../common/decorators/current-owner.decorator';
import { StepUpRequiredGuard, StepUpAction } from '../common/guards/step-up.guard';
import { JwtPayload } from '../auth/jwt.strategy';

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).optional(),
});

const KycSchema = z.object({
  gstin: z.string().optional(),
  pan: z.string().optional(),
  bankAccountHolderName: z.string().min(1),
  bankAccountNumber: z.string().min(1),
  bankIfsc: z.string().min(1),
});

const RazorpayKeysSchema = z.object({
  keyId: z.string().min(1),
  keySecret: z.string().min(1),
  webhookSecret: z.string().min(1),
});

@Controller('owners')
@Roles('owner')
export class OwnersController {
  constructor(private readonly svc: OwnersService) {}

  @Get('me')
  async getProfile(@CurrentOwner() payload: JwtPayload) {
    return this.svc.getProfile(payload.sub);
  }

  @Patch('me')
  async updateProfile(
    @CurrentOwner() payload: JwtPayload,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) body: z.infer<typeof UpdateProfileSchema>,
  ) {
    return this.svc.updateProfile(payload.sub, body);
  }

  @Put('me/kyc')
  async updateKyc(
    @CurrentOwner() payload: JwtPayload,
    @Body(new ZodValidationPipe(KycSchema)) body: z.infer<typeof KycSchema>,
  ) {
    return this.svc.updateKyc(payload.sub, body);
  }

  @Put('me/razorpay-keys')
  @UseGuards(StepUpRequiredGuard)
  @StepUpAction('update_razorpay_keys')
  async updateRazorpayKeys(
    @CurrentOwner() payload: JwtPayload,
    @Body(new ZodValidationPipe(RazorpayKeysSchema)) body: z.infer<typeof RazorpayKeysSchema>,
  ) {
    return this.svc.updateRazorpayKeys(payload.sub, body);
  }

  @Get('me/razorpay-keys/status')
  async getRazorpayKeysStatus(@CurrentOwner() payload: JwtPayload) {
    return this.svc.getRazorpayKeysStatus(payload.sub);
  }

  @Get('me/dashboard')
  async getDashboard(@CurrentOwner() payload: JwtPayload) {
    return this.svc.getDashboard(payload.sub);
  }

  @Get('me/bookings')
  async getBookings(
    @CurrentOwner() payload: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.svc.getBookings(payload.sub, { page, pageSize });
  }
}
