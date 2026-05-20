import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { HashService } from '../../crypto/hash.service';
import { TokenService } from '../token.service';
import { SuperAdmin } from '@prisma/client';

const MAX_FAILURES = 5;
const FAILURE_WINDOW_SECONDS = 15 * 60; // 15 min
const LOCKOUT_SECONDS = 30 * 60; // 30 min

function sanitizeAdmin(admin: SuperAdmin) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    lastLoginAt: admin.lastLoginAt,
    createdAt: admin.createdAt,
  };
}

@Injectable()
export class SuperAdminAuthService {
  private readonly logger = new Logger(SuperAdminAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly hash: HashService,
    private readonly tokens: TokenService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ admin: ReturnType<typeof sanitizeAdmin>; accessToken: string; refreshToken: string }> {
    const admin = await this.prisma.superAdmin.findUnique({ where: { email } });

    // Check lockout before revealing whether account exists
    if (admin) {
      await this.checkLockout(admin.id);
    }

    if (!admin) {
      throw new UnauthorizedException({ error: 'UNAUTHENTICATED', message: 'Invalid credentials' });
    }

    const valid = await this.hash.verify(admin.passwordHash, password);
    if (!valid) {
      await this.recordFailure(admin.id);
      throw new UnauthorizedException({ error: 'UNAUTHENTICATED', message: 'Invalid credentials' });
    }

    // Clear failure count on success
    await this.clearFailures(admin.id);

    await this.prisma.superAdmin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = this.tokens.issueAccessToken(admin.id, 'super_admin');
    const refreshToken = await this.tokens.issueRefreshToken(admin.id, 'super_admin');

    return { admin: sanitizeAdmin(admin), accessToken, refreshToken };
  }

  async refresh(rawToken: string): Promise<{ accessToken: string; newRefreshToken: string }> {
    const { sub, newRaw } = await this.tokens.rotateRefreshToken(rawToken, 'super_admin');
    const admin = await this.prisma.superAdmin.findUnique({ where: { id: sub } });
    if (!admin) throw new UnauthorizedException({ error: 'UNAUTHENTICATED', message: 'Admin not found' });
    return { accessToken: this.tokens.issueAccessToken(sub, 'super_admin'), newRefreshToken: newRaw };
  }

  async logout(rawToken: string): Promise<void> {
    await this.tokens.revokeRefreshToken(rawToken, 'super_admin');
  }

  async getMe(adminId: string): Promise<ReturnType<typeof sanitizeAdmin>> {
    const admin = await this.prisma.superAdmin.findUnique({ where: { id: adminId } });
    if (!admin) throw new NotFoundException({ error: 'NOT_FOUND', message: 'Admin not found' });
    return sanitizeAdmin(admin);
  }

  private async checkLockout(adminId: string): Promise<void> {
    const client = this.redis.getClient();
    const lockedKey = `lockout:admin:${adminId}`;
    const locked = await client.exists(lockedKey);
    if (locked) {
      throw new ForbiddenException({
        error: 'ACCOUNT_LOCKED',
        message: 'Account locked due to too many failed attempts. Try again later.',
      });
    }
  }

  private async recordFailure(adminId: string): Promise<void> {
    const client = this.redis.getClient();
    const failKey = `login-fail:admin:${adminId}`;
    const count = await client.incr(failKey);
    if (count === 1) {
      await client.expire(failKey, FAILURE_WINDOW_SECONDS);
    }
    if (count >= MAX_FAILURES) {
      await client.setex(`lockout:admin:${adminId}`, LOCKOUT_SECONDS, '1');
      await client.del(failKey);
      this.logger.warn(`Admin ${adminId} locked out after ${count} failed attempts`);
    }
  }

  private async clearFailures(adminId: string): Promise<void> {
    await this.redis.getClient().del(`login-fail:admin:${adminId}`);
  }
}
