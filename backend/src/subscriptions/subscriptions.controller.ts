import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { z } from 'zod';
import { SubscriptionsService } from './subscriptions.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentOwner } from '../common/decorators/current-owner.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

const SubscribeSchema = z.object({
  planCode: z.string().min(1),
});

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly svc: SubscriptionsService) {}

  @Public()
  @Get('plans')
  async getPlans() {
    return this.svc.getPlans();
  }

  @Roles('owner')
  @Get('me')
  async getMySubscription(@CurrentOwner() payload: JwtPayload) {
    return this.svc.getMySubscription(payload.sub);
  }

  @Roles('owner')
  @Post('me/subscribe')
  async subscribe(
    @CurrentOwner() payload: JwtPayload,
    @Body(new ZodValidationPipe(SubscribeSchema)) body: z.infer<typeof SubscribeSchema>,
  ) {
    return this.svc.subscribe(payload.sub, body.planCode);
  }

  @Roles('owner')
  @Post('me/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@CurrentOwner() payload: JwtPayload) {
    return this.svc.cancel(payload.sub);
  }
}
