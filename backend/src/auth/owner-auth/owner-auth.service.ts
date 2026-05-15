import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { HashService } from '../../crypto/hash.service';
import { TokenService } from '../token.service';
import { Owner } from '@prisma/client';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;

const STEP_UP_OTP_TTL = 10 * 60;
const STEP_UP_TOKEN_TTL = 10 * 60;
const RESET_TTL = 60 * 60; // 1 hour

function validatePassword(password: string): void {
  if (!PASSWORD_REGEX.test(password)) {
    throw new BadRequestException({
      error: 'VALIDATION_ERROR',
      message:
        'Password must be at least 10 characters and contain uppercase, lowercase, and digit',
    });
  }
}

function sanitizeOwner(owner: Owner) {
  return {
    id: owner.id,
    email: owner.email,
    name: owner.name,
    phone: owner.phone,
    kycStatus: owner.kycStatus,
    subscriptionStatus: owner.subscriptionStatus,
    createdAt: owner.createdAt,
  };
}

@Injectable()
export class OwnerAuthService {
  private readonly logger = new Logger(OwnerAuthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly hash: HashService,
    private readonly tokens: TokenService,
  ) {}

  async register(
    email: string,
    password: string,
    name: string,
    phone: string,
  ): Promise<{ ownerId: string }> {
    validatePassword(password);

    const existing = await this.prisma.owner.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException({ error: 'CONFLICT', message: 'Email already registered' });
    }

    const passwordHash = await this.hash.hash(password);
    const owner = await this.prisma.owner.create({
      data: { email, passwordHash, name, phone },
    });

    return { ownerId: owner.id };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ owner: ReturnType<typeof sanitizeOwner>; accessToken: string; refreshToken: string }> {
    const owner = await this.prisma.owner.findUnique({ where: { email } });

    if (!owner?.passwordHash) {
      throw new UnauthorizedException({ error: 'UNAUTHENTICATED', message: 'Invalid credentials' });
    }

    this.assertNotSuspended(owner);

    const valid = await this.hash.verify(owner.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException({ error: 'UNAUTHENTICATED', message: 'Invalid credentials' });
    }

    const accessToken = this.tokens.issueAccessToken(owner.id, 'owner');
    const refreshToken = await this.tokens.issueRefreshToken(owner.id, 'owner');

    return { owner: sanitizeOwner(owner), accessToken, refreshToken };
  }

  async refresh(rawToken: string): Promise<{ accessToken: string; newRefreshToken: string }> {
    const { sub, newRaw } = await this.tokens.rotateRefreshToken(rawToken, 'owner');
    const owner = await this.prisma.owner.findUnique({ where: { id: sub } });
    if (!owner) throw new UnauthorizedException({ error: 'UNAUTHENTICATED', message: 'Owner not found' });
    this.assertNotSuspended(owner);
    return { accessToken: this.tokens.issueAccessToken(sub, 'owner'), newRefreshToken: newRaw };
  }

  async logout(rawToken: string): Promise<void> {
    await this.tokens.revokeRefreshToken(rawToken, 'owner');
  }

  async getMe(ownerId: string): Promise<ReturnType<typeof sanitizeOwner>> {
    const owner = await this.prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Owner not found' });
    return sanitizeOwner(owner);
  }

  async forgotPassword(email: string): Promise<void> {
    const owner = await this.prisma.owner.findUnique({ where: { email } });
    if (!owner) return; // silent no-op to prevent enumeration

    const token = randomUUID();
    await this.redis
      .getClient()
      .setex(`reset-password:owner:${token}`, RESET_TTL, owner.id);

    if (this.config.get('NODE_ENV') !== 'production') {
      this.logger.log(`[DEV] Password reset token for ${email}: ${token}`);
    }
    // In production: send email via EmailService
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    validatePassword(newPassword);

    const client = this.redis.getClient();
    const ownerId = await client.get(`reset-password:owner:${token}`);
    if (!ownerId) {
      throw new BadRequestException({ error: 'INVALID_TOKEN', message: 'Reset token invalid or expired' });
    }

    await client.del(`reset-password:owner:${token}`);

    const passwordHash = await this.hash.hash(newPassword);
    await this.prisma.owner.update({
      where: { id: ownerId },
      data: { passwordHash },
    });

    // Revoke all refresh tokens for security
    await this.tokens.revokeAllForSubject(ownerId, 'owner');
  }

  async requestStepUp(ownerId: string, action: string): Promise<void> {
    const owner = await this.prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Owner not found' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await this.redis
      .getClient()
      .setex(`stepup:owner:${ownerId}:${action}`, STEP_UP_OTP_TTL, otp);

    if (this.config.get('NODE_ENV') !== 'production') {
      this.logger.log(`[DEV] Step-up OTP for owner=${ownerId} action=${action}: ${otp}`);
    }
    // In production: send email via EmailService
  }

  async verifyStepUp(ownerId: string, action: string, otp: string): Promise<{ stepUpToken: string }> {
    const client = this.redis.getClient();
    const key = `stepup:owner:${ownerId}:${action}`;
    const stored = await client.get(key);

    if (!stored || stored !== otp) {
      throw new UnauthorizedException({ error: 'UNAUTHENTICATED', message: 'Invalid or expired OTP' });
    }

    await client.del(key);

    const stepUpToken = randomUUID();
    await client.setex(
      `stepup-token:${stepUpToken}`,
      STEP_UP_TOKEN_TTL,
      JSON.stringify({ ownerId, action }),
    );

    return { stepUpToken };
  }

  private assertNotSuspended(owner: Owner): void {
    if (owner.isSuspended) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Account is suspended' });
    }
  }
}
