import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { UsersService } from '../../users/users.service';
import { TokenService } from '../token.service';

const OTP_TTL_SECONDS = 300; // 5 min
const OTP_MAX_ATTEMPTS = 5;

interface OtpRecord {
  code: string;
  attempts: number;
  createdAt: number;
}

@Injectable()
export class UserAuthService {
  private readonly logger = new Logger(UserAuthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly users: UsersService,
    private readonly tokens: TokenService,
  ) {}

  // ── Phone normalization ─────────────────────────────────────────────────────

  normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    if (digits.length === 13 && digits.startsWith('091')) return `+91${digits.slice(3)}`;
    throw new BadRequestException({ error: 'VALIDATION_ERROR', message: 'Invalid phone number format' });
  }

  // ── Rate limiting ────────────────────────────────────────────────────────────

  private async checkRateLimit(key: string, max: number, windowSeconds: number): Promise<void> {
    const client = this.redis.getClient();
    const count = await client.incr(key);
    if (count === 1) await client.expire(key, windowSeconds);
    if (count > max) {
      throw new BadRequestException({ error: 'RATE_LIMITED', message: 'Too many OTP requests' });
    }
  }

  // ── OTP flow ─────────────────────────────────────────────────────────────────

  async sendOtp(rawPhone: string, ip: string): Promise<void> {
    const phone = this.normalizePhone(rawPhone);

    const maxPerPhone = this.config.get<number>('RATE_LIMIT_OTP_PER_PHONE_PER_15MIN', 3);
    const maxPerIp = this.config.get<number>('RATE_LIMIT_OTP_PER_IP_PER_HOUR', 10);

    await Promise.all([
      this.checkRateLimit(`rl:otp:phone:${phone}`, maxPerPhone, 15 * 60),
      this.checkRateLimit(`rl:otp:ip:${ip}`, maxPerIp, 60 * 60),
    ]);

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const record: OtpRecord = { code, attempts: 0, createdAt: Date.now() };
    await this.redis.getClient().setex(`otp:user:${phone}`, OTP_TTL_SECONDS, JSON.stringify(record));

    // In dev: log OTP instead of sending SMS
    if (this.config.get('NODE_ENV') !== 'production') {
      this.logger.log(`[DEV] OTP for ${phone}: ${code}`);
    } else {
      // TODO Step 19: dispatch via NotificationService SMS
    }
  }

  async verifyOtp(rawPhone: string, otp: string): Promise<{ accessToken: string; refreshToken: string; user: object }> {
    const phone = this.normalizePhone(rawPhone);
    const client = this.redis.getClient();
    const key = `otp:user:${phone}`;

    const raw = await client.get(key);
    if (!raw) {
      throw new UnauthorizedException({ error: 'UNAUTHENTICATED', message: 'OTP expired or not requested' });
    }

    const record: OtpRecord = JSON.parse(raw);
    record.attempts += 1;

    if (record.attempts > OTP_MAX_ATTEMPTS) {
      await client.del(key);
      throw new UnauthorizedException({ error: 'UNAUTHENTICATED', message: 'OTP attempt limit exceeded' });
    }

    if (record.code !== otp) {
      // Persist updated attempt count
      const ttl = await client.ttl(key);
      if (ttl > 0) await client.setex(key, ttl, JSON.stringify(record));
      throw new UnauthorizedException({ error: 'UNAUTHENTICATED', message: 'Invalid OTP' });
    }

    await client.del(key);

    const user = await this.users.upsertByPhone(phone);
    this.users.assertNotBlocked(user);

    const accessToken = this.tokens.issueAccessToken(user.id, 'user');
    const refreshToken = await this.tokens.issueRefreshToken(user.id, 'user');

    return { accessToken, refreshToken, user: this.sanitizeUser(user) };
  }

  async refresh(rawToken: string): Promise<{ accessToken: string; newRefreshToken: string }> {
    const { sub, newRaw } = await this.tokens.rotateRefreshToken(rawToken, 'user');
    const user = await this.users.findById(sub);
    if (!user) throw new UnauthorizedException({ error: 'UNAUTHENTICATED', message: 'User not found' });
    this.users.assertNotBlocked(user);
    return { accessToken: this.tokens.issueAccessToken(sub, 'user'), newRefreshToken: newRaw };
  }

  async logout(rawToken: string): Promise<void> {
    await this.tokens.revokeRefreshToken(rawToken, 'user');
  }

  private sanitizeUser(user: any) {
    return { id: user.id, phone: user.phone, name: user.name, email: user.email };
  }
}
