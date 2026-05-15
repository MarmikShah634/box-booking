import { Controller, Post, Get, Body, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { z } from 'zod';
import { UserAuthService } from './user-auth.service';
import { TokenService } from '../token.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../jwt.strategy';

const SendOtpSchema = z.object({ phone: z.string().min(1) });
const VerifyOtpSchema = z.object({ phone: z.string().min(1), otp: z.string().length(6) });

@Controller('auth/user')
export class UserAuthController {
  constructor(
    private readonly svc: UserAuthService,
    private readonly tokens: TokenService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendOtp(
    @Body(new ZodValidationPipe(SendOtpSchema)) body: z.infer<typeof SendOtpSchema>,
    @Req() req: Request,
  ): Promise<void> {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? '0.0.0.0';
    await this.svc.sendOtp(body.phone, ip);
  }

  @Public()
  @Post('verify-otp')
  async verifyOtp(
    @Body(new ZodValidationPipe(VerifyOtpSchema)) body: z.infer<typeof VerifyOtpSchema>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.svc.verifyOtp(body.phone, body.otp);
    this.tokens.setRefreshCookie(res, refreshToken, 'user');
    return { user, accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.['refresh_user'];
    if (!raw) throw new Error('No refresh token');
    const { accessToken, newRefreshToken } = await this.svc.refresh(raw);
    this.tokens.setRefreshCookie(res, newRefreshToken, 'user');
    return { accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const raw = req.cookies?.['refresh_user'];
    if (raw) await this.svc.logout(raw);
    this.tokens.clearRefreshCookie(res, 'user');
  }

  @Roles('user')
  @Get('me')
  async me(@CurrentUser() payload: JwtPayload) {
    const user = await this.users.findById(payload.sub);
    if (!user) throw new Error('User not found');
    return { id: user.id, phone: user.phone, name: user.name, email: user.email };
  }
}
