import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { z } from 'zod';
import { R2Service } from './r2.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentOwner } from '../common/decorators/current-owner.decorator';
import { JwtPayload } from '../auth/jwt.strategy';


const PresignUploadSchema = z.object({
  purpose: z.enum(['venue-photo', 'box-photo', 'invoice', 'kyc']),
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(20 * 1024 * 1024), // 20 MB max
});

@Controller('storage')
@Roles('owner')
export class StorageController {
  constructor(private readonly r2: R2Service) {}

  @Post('presign-upload')
  async presignUpload(
    @CurrentOwner() payload: JwtPayload,
    @Body(new ZodValidationPipe(PresignUploadSchema)) body: z.infer<typeof PresignUploadSchema>,
  ) {
    const key = this.r2.buildKey(body.purpose, payload.sub, body.filename);
    return this.r2.presignUpload(key, body.contentType);
  }

  @Get('sign-download')
  async signDownload(
    @CurrentOwner() payload: JwtPayload,
    @Query('key') key?: string,
  ) {
    if (!key) throw new BadRequestException({ error: 'VALIDATION_ERROR', message: 'key is required' });
    const url = await this.r2.presignDownload(key);
    return { url };
  }
}
