import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { z } from 'zod';
import { SuperAdminAuthService } from './super-admin-auth.service';
import { TokenService } from '../token.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { JwtPayload } from '../jwt.strategy';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

@Controller('auth/super-admin')
export class SuperAdminAuthController {
  constructor(
    private readonly svc: SuperAdminAuthService,
    private readonly tokens: TokenService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) body: z.infer<typeof LoginSchema>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { admin, accessToken, refreshToken } = await this.svc.login(body.email, body.password);
    this.tokens.setRefreshCookie(res, refreshToken, 'super_admin');
    return { admin, accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.['refresh_super_admin'] as string | undefined;
    if (!raw) throw new Error('No refresh token');
    const { accessToken, newRefreshToken } = await this.svc.refresh(raw);
    this.tokens.setRefreshCookie(res, newRefreshToken, 'super_admin');
    return { accessToken };
  }

  @Roles('super_admin')
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const raw = req.cookies?.['refresh_super_admin'] as string | undefined;
    if (raw) await this.svc.logout(raw);
    this.tokens.clearRefreshCookie(res, 'super_admin');
  }

  @Roles('super_admin')
  @Get('me')
  async me(@CurrentAdmin() payload: JwtPayload) {
    return this.svc.getMe(payload.sub);
  }
}
