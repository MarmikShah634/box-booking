import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { z } from 'zod';
import { ReviewsService } from './reviews.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentOwner } from '../common/decorators/current-owner.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional(),
});

const ReplySchema = z.object({
  ownerReply: z.string().min(1).max(2000),
});

@Controller()
export class ReviewsController {
  constructor(private readonly svc: ReviewsService) {}

  @Roles('user')
  @Post('bookings/:id/review')
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @CurrentUser() payload: JwtPayload,
    @Param('id') bookingId: string,
    @Body(new ZodValidationPipe(CreateReviewSchema)) body: z.infer<typeof CreateReviewSchema>,
  ) {
    return this.svc.createReview(payload.sub, bookingId, body.rating, body.text);
  }

  @Roles('owner')
  @Post('reviews/:id/reply')
  async replyToReview(
    @CurrentOwner() payload: JwtPayload,
    @Param('id') reviewId: string,
    @Body(new ZodValidationPipe(ReplySchema)) body: z.infer<typeof ReplySchema>,
  ) {
    return this.svc.replyToReview(payload.sub, reviewId, body.ownerReply);
  }

  @Public()
  @Get('venues/:slug/reviews')
  async getVenueReviews(
    @Param('slug') slug: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.svc.getVenueReviews(slug, page, Math.min(100, pageSize));
  }
}
