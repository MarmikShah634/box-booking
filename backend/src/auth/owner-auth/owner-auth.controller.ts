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
import { OwnerAuthService } from './owner-auth.service';
import { TokenService } from '../token.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentOwner } from '../../common/decorators/current-owner.decorator';
import { JwtPayload } from '../jwt.strategy';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  name: z.string().min(1).max(100),
  phone: z.string().min(1),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ForgotPasswordSchema = z.object({ email: z.string().email() });

const ResetPasswordSchema = z.object({
  token: z.string().uuid(),
  password: z.string().min(1),
});

const StepUpActionSchema = z.object({ action: z.string().min(1) });
const VerifyStepUpSchema = z.object({
  action: z.string().min(1),
  otp: z.string().length(6),
});

@Controller('auth/owner')
export class OwnerAuthController {
  constructor(
    private readonly svc: OwnerAuthService,
    private readonly tokens: TokenService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(RegisterSchema)) body: z.infer<typeof RegisterSchema>,
  ) {
    return this.svc.register(body.email, body.password, body.name, body.phone);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(LoginSchema)) body: z.infer<typeof LoginSchema>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { owner, accessToken, refreshToken } = await this.svc.login(body.email, body.password);
    this.tokens.setRefreshCookie(res, refreshToken, 'owner');
    return { owner, accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.['refresh_owner'] as string | undefined;
    if (!raw) throw new Error('No refresh token');
    const { accessToken, newRefreshToken } = await this.svc.refresh(raw);
    this.tokens.setRefreshCookie(res, newRefreshToken, 'owner');
    return { accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const raw = req.cookies?.['refresh_owner'] as string | undefined;
    if (raw) await this.svc.logout(raw);
    this.tokens.clearRefreshCookie(res, 'owner');
  }

  @Roles('owner')
  @Get('me')
  async me(@CurrentOwner() payload: JwtPayload) {
    return this.svc.getMe(payload.sub);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(
    @Body(new ZodValidationPipe(ForgotPasswordSchema)) body: z.infer<typeof ForgotPasswordSchema>,
  ): Promise<void> {
    await this.svc.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(
    @Body(new ZodValidationPipe(ResetPasswordSchema)) body: z.infer<typeof ResetPasswordSchema>,
  ): Promise<void> {
    await this.svc.resetPassword(body.token, body.password);
  }

  @Roles('owner')
  @Post('request-step-up')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestStepUp(
    @CurrentOwner() payload: JwtPayload,
    @Body(new ZodValidationPipe(StepUpActionSchema)) body: z.infer<typeof StepUpActionSchema>,
  ): Promise<void> {
    await this.svc.requestStepUp(payload.sub, body.action);
  }

  @Roles('owner')
  @Post('verify-step-up')
  async verifyStepUp(
    @CurrentOwner() payload: JwtPayload,
    @Body(new ZodValidationPipe(VerifyStepUpSchema)) body: z.infer<typeof VerifyStepUpSchema>,
  ) {
    return this.svc.verifyStepUp(payload.sub, body.action, body.otp);
  }
}
