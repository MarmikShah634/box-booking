import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import type { ConfigService } from '@nestjs/config';
import type { RedisService } from '../../redis/redis.service';
import type { UsersService } from '../../users/users.service';
import type { TokenService } from '../token.service';
import type { User } from '@prisma/client';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRedisClient() {
  return {
    incr: jest.fn(),
    expire: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    ttl: jest.fn(),
  };
}

function makeService() {
  const redisClient = makeRedisClient();
  const mockRedis = {
    getClient: jest.fn().mockReturnValue(redisClient),
  } as unknown as RedisService;

  const mockUsers = {
    upsertByPhone: jest.fn(),
    findById: jest.fn(),
    assertNotBlocked: jest.fn(),
  } as unknown as UsersService;

  const mockTokens = {
    issueAccessToken: jest.fn(),
    issueRefreshToken: jest.fn(),
    rotateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
  } as unknown as TokenService;

  const mockConfig = {
    get: jest.fn(),
  } as unknown as ConfigService;

  const svc = new UserAuthService(mockConfig, mockRedis, mockUsers, mockTokens);

  return { svc, redisClient, mockRedis, mockUsers, mockTokens, mockConfig };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    phone: '+919876543210',
    name: null,
    email: null,
    isBlocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

// ── normalizePhone ────────────────────────────────────────────────────────────

describe('UserAuthService.normalizePhone', () => {
  let svc: UserAuthService;

  beforeEach(() => {
    ({ svc } = makeService());
  });

  it('normalizes 10-digit number by prepending +91', () => {
    expect(svc.normalizePhone('9876543210')).toBe('+919876543210');
  });

  it('normalizes 12-digit number starting with 91', () => {
    expect(svc.normalizePhone('919876543210')).toBe('+919876543210');
  });

  it('normalizes 13-digit number starting with 091', () => {
    expect(svc.normalizePhone('0919876543210')).toBe('+919876543210');
  });

  it('strips non-digit characters before normalizing', () => {
    expect(svc.normalizePhone('+91 98765 43210')).toBe('+919876543210');
  });

  it('throws BadRequestException with VALIDATION_ERROR for short number', () => {
    expect(() => svc.normalizePhone('12345')).toThrow(BadRequestException);
  });

  it('throws BadRequestException error code VALIDATION_ERROR for short number', () => {
    try {
      svc.normalizePhone('12345');
    } catch (e) {
      const ex = e as BadRequestException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('VALIDATION_ERROR');
    }
  });

  it('throws BadRequestException for 11-digit number that does not start with 91', () => {
    expect(() => svc.normalizePhone('12345678901')).toThrow(BadRequestException);
  });
});

// ── sendOtp ───────────────────────────────────────────────────────────────────

describe('UserAuthService.sendOtp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls checkRateLimit for both phone and ip keys', async () => {
    const { svc, redisClient, mockConfig } = makeService();
    (mockConfig.get as jest.Mock).mockImplementation((key: string, def?: unknown) => {
      if (key === 'RATE_LIMIT_OTP_PER_PHONE_PER_15MIN') return 3;
      if (key === 'RATE_LIMIT_OTP_PER_IP_PER_HOUR') return 10;
      if (key === 'NODE_ENV') return 'development';
      return def;
    });

    redisClient.incr.mockResolvedValue(1);
    redisClient.expire.mockResolvedValue(1);
    redisClient.setex.mockResolvedValue('OK');

    await svc.sendOtp('9876543210', '127.0.0.1');

    const incrCalls = (redisClient.incr).mock.calls.map((c: unknown[]) => c[0]);
    expect(incrCalls).toContain('rl:otp:phone:+919876543210');
    expect(incrCalls).toContain('rl:otp:ip:127.0.0.1');
  });

  it('stores OTP record in Redis with TTL 300', async () => {
    const { svc, redisClient, mockConfig } = makeService();
    (mockConfig.get as jest.Mock).mockImplementation((key: string, def?: unknown) => {
      if (key === 'RATE_LIMIT_OTP_PER_PHONE_PER_15MIN') return 3;
      if (key === 'RATE_LIMIT_OTP_PER_IP_PER_HOUR') return 10;
      if (key === 'NODE_ENV') return 'development';
      return def;
    });

    redisClient.incr.mockResolvedValue(1);
    redisClient.expire.mockResolvedValue(1);
    redisClient.setex.mockResolvedValue('OK');

    await svc.sendOtp('9876543210', '127.0.0.1');

    const setexCalls = (redisClient.setex).mock.calls;
    expect(setexCalls.length).toBeGreaterThan(0);
    const otpCall = setexCalls.find((c: unknown[]) =>
      typeof c[0] === 'string' && c[0].startsWith('otp:user:'),
    );
    expect(otpCall).toBeDefined();
    expect(otpCall![1]).toBe(300);
    const record = JSON.parse(otpCall![2] as string) as { code: string; attempts: number };
    expect(record.attempts).toBe(0);
    expect(record.code).toMatch(/^\d{6}$/);
  });

  it('logs OTP in non-production environments', async () => {
    const { svc, redisClient, mockConfig } = makeService();
    (mockConfig.get as jest.Mock).mockImplementation((key: string, def?: unknown) => {
      if (key === 'RATE_LIMIT_OTP_PER_PHONE_PER_15MIN') return 3;
      if (key === 'RATE_LIMIT_OTP_PER_IP_PER_HOUR') return 10;
      if (key === 'NODE_ENV') return 'development';
      return def;
    });

    redisClient.incr.mockResolvedValue(1);
    redisClient.expire.mockResolvedValue(1);
    redisClient.setex.mockResolvedValue('OK');

    // Spy on the private logger
    const logSpy = jest.spyOn((svc as unknown as { logger: { log: jest.Mock } }).logger, 'log');
    await svc.sendOtp('9876543210', '127.0.0.1');

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[DEV]'));
  });

  it('throws RATE_LIMITED when phone rate limit exceeded', async () => {
    const { svc, redisClient, mockConfig } = makeService();
    (mockConfig.get as jest.Mock).mockImplementation((key: string, def?: unknown) => {
      if (key === 'RATE_LIMIT_OTP_PER_PHONE_PER_15MIN') return 3;
      if (key === 'RATE_LIMIT_OTP_PER_IP_PER_HOUR') return 10;
      return def;
    });

    // Phone counter exceeds limit
    redisClient.incr.mockResolvedValueOnce(4).mockResolvedValueOnce(1);
    redisClient.expire.mockResolvedValue(1);

    await expect(svc.sendOtp('9876543210', '127.0.0.1')).rejects.toThrow(BadRequestException);
  });

  it('throws RATE_LIMITED error code when rate limit exceeded', async () => {
    const { svc, redisClient, mockConfig } = makeService();
    (mockConfig.get as jest.Mock).mockImplementation((key: string, def?: unknown) => {
      if (key === 'RATE_LIMIT_OTP_PER_PHONE_PER_15MIN') return 3;
      if (key === 'RATE_LIMIT_OTP_PER_IP_PER_HOUR') return 10;
      return def;
    });

    redisClient.incr.mockResolvedValueOnce(4).mockResolvedValueOnce(1);
    redisClient.expire.mockResolvedValue(1);

    try {
      await svc.sendOtp('9876543210', '127.0.0.1');
    } catch (e) {
      const ex = e as BadRequestException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('RATE_LIMITED');
    }
  });

  it('sets expire only on first incr (count === 1)', async () => {
    const { svc, redisClient, mockConfig } = makeService();
    (mockConfig.get as jest.Mock).mockImplementation((key: string, def?: unknown) => {
      if (key === 'RATE_LIMIT_OTP_PER_PHONE_PER_15MIN') return 3;
      if (key === 'RATE_LIMIT_OTP_PER_IP_PER_HOUR') return 10;
      if (key === 'NODE_ENV') return 'development';
      return def;
    });

    // Both counters return 2 (not first hit)
    redisClient.incr.mockResolvedValue(2);
    redisClient.expire.mockResolvedValue(1);
    redisClient.setex.mockResolvedValue('OK');

    await svc.sendOtp('9876543210', '127.0.0.1');

    expect(redisClient.expire).not.toHaveBeenCalled();
  });
});

// ── verifyOtp ─────────────────────────────────────────────────────────────────

describe('UserAuthService.verifyOtp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws UNAUTHENTICATED if no OTP record found in Redis', async () => {
    const { svc, redisClient } = makeService();
    redisClient.get.mockResolvedValue(null);

    await expect(svc.verifyOtp('9876543210', '123456')).rejects.toThrow(UnauthorizedException);
  });

  it('throws UNAUTHENTICATED error code when OTP record missing', async () => {
    const { svc, redisClient } = makeService();
    redisClient.get.mockResolvedValue(null);

    try {
      await svc.verifyOtp('9876543210', '123456');
    } catch (e) {
      const ex = e as UnauthorizedException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('UNAUTHENTICATED');
    }
  });

  it('increments attempt count and re-saves on wrong OTP', async () => {
    const { svc, redisClient } = makeService();
    const record = { code: '999999', attempts: 0, createdAt: Date.now() };
    redisClient.get.mockResolvedValue(JSON.stringify(record));
    redisClient.ttl.mockResolvedValue(200);
    redisClient.setex.mockResolvedValue('OK');

    await expect(svc.verifyOtp('9876543210', '111111')).rejects.toThrow(UnauthorizedException);

    expect(redisClient.setex).toHaveBeenCalledWith(
      'otp:user:+919876543210',
      200,
      JSON.stringify({ ...record, attempts: 1 }),
    );
  });

  it('deletes OTP key and throws UNAUTHENTICATED after exceeding max attempts', async () => {
    const { svc, redisClient } = makeService();
    // attempts is already at OTP_MAX_ATTEMPTS (5); incrementing makes it 6 which is > 5
    const record = { code: '999999', attempts: 5, createdAt: Date.now() };
    redisClient.get.mockResolvedValue(JSON.stringify(record));
    redisClient.del.mockResolvedValue(1);

    await expect(svc.verifyOtp('9876543210', '111111')).rejects.toThrow(UnauthorizedException);
    expect(redisClient.del).toHaveBeenCalledWith('otp:user:+919876543210');
  });

  it('deletes OTP key, upserts user, and returns tokens on correct OTP', async () => {
    const { svc, redisClient, mockUsers, mockTokens } = makeService();
    const record = { code: '123456', attempts: 0, createdAt: Date.now() };
    redisClient.get.mockResolvedValue(JSON.stringify(record));
    redisClient.del.mockResolvedValue(1);

    const user = makeUser();
    (mockUsers.upsertByPhone as jest.Mock).mockResolvedValue(user);
    (mockUsers.assertNotBlocked as jest.Mock).mockReturnValue(undefined);
    (mockTokens.issueAccessToken as jest.Mock).mockReturnValue('access-token');
    (mockTokens.issueRefreshToken as jest.Mock).mockResolvedValue('refresh-token');

    const result = await svc.verifyOtp('9876543210', '123456');

    expect(redisClient.del).toHaveBeenCalledWith('otp:user:+919876543210');
    expect(mockUsers.upsertByPhone).toHaveBeenCalledWith('+919876543210');
    expect(result).toMatchObject({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  });

  it('calls assertNotBlocked after successful OTP verification', async () => {
    const { svc, redisClient, mockUsers, mockTokens } = makeService();
    const record = { code: '123456', attempts: 0, createdAt: Date.now() };
    redisClient.get.mockResolvedValue(JSON.stringify(record));
    redisClient.del.mockResolvedValue(1);

    const user = makeUser();
    (mockUsers.upsertByPhone as jest.Mock).mockResolvedValue(user);
    (mockUsers.assertNotBlocked as jest.Mock).mockReturnValue(undefined);
    (mockTokens.issueAccessToken as jest.Mock).mockReturnValue('access-token');
    (mockTokens.issueRefreshToken as jest.Mock).mockResolvedValue('refresh-token');

    await svc.verifyOtp('9876543210', '123456');

    expect(mockUsers.assertNotBlocked).toHaveBeenCalledWith(user);
  });

  it('returns sanitized user object (no sensitive fields)', async () => {
    const { svc, redisClient, mockUsers, mockTokens } = makeService();
    const record = { code: '123456', attempts: 0, createdAt: Date.now() };
    redisClient.get.mockResolvedValue(JSON.stringify(record));
    redisClient.del.mockResolvedValue(1);

    const user = makeUser({ id: 'u1', phone: '+919876543210', name: 'Test User', email: 'test@example.com' });
    (mockUsers.upsertByPhone as jest.Mock).mockResolvedValue(user);
    (mockUsers.assertNotBlocked as jest.Mock).mockReturnValue(undefined);
    (mockTokens.issueAccessToken as jest.Mock).mockReturnValue('at');
    (mockTokens.issueRefreshToken as jest.Mock).mockResolvedValue('rt');

    const result = await svc.verifyOtp('9876543210', '123456');

    expect(result.user).toMatchObject({ id: 'u1', phone: '+919876543210', name: 'Test User', email: 'test@example.com' });
  });

  it('propagates ForbiddenException from assertNotBlocked for blocked users', async () => {
    const { svc, redisClient, mockUsers, mockTokens } = makeService();
    const record = { code: '123456', attempts: 0, createdAt: Date.now() };
    redisClient.get.mockResolvedValue(JSON.stringify(record));
    redisClient.del.mockResolvedValue(1);

    const user = makeUser({ isBlocked: true });
    (mockUsers.upsertByPhone as jest.Mock).mockResolvedValue(user);
    (mockUsers.assertNotBlocked as jest.Mock).mockImplementation(() => {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Account is blocked' });
    });
    (mockTokens.issueAccessToken as jest.Mock).mockReturnValue('at');
    (mockTokens.issueRefreshToken as jest.Mock).mockResolvedValue('rt');

    await expect(svc.verifyOtp('9876543210', '123456')).rejects.toThrow(ForbiddenException);
  });
});

// ── refresh ───────────────────────────────────────────────────────────────────

describe('UserAuthService.refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls rotateRefreshToken with the raw token', async () => {
    const { svc, mockTokens, mockUsers } = makeService();
    (mockTokens.rotateRefreshToken as jest.Mock).mockResolvedValue({ sub: 'user-1', newRaw: 'new-raw' });
    (mockUsers.findById as jest.Mock).mockResolvedValue(makeUser());
    (mockUsers.assertNotBlocked as jest.Mock).mockReturnValue(undefined);
    (mockTokens.issueAccessToken as jest.Mock).mockReturnValue('new-access');

    await svc.refresh('old-raw-token');

    expect(mockTokens.rotateRefreshToken).toHaveBeenCalledWith('old-raw-token', 'user');
  });

  it('throws UNAUTHENTICATED if user not found after token rotation', async () => {
    const { svc, mockTokens, mockUsers } = makeService();
    (mockTokens.rotateRefreshToken as jest.Mock).mockResolvedValue({ sub: 'user-1', newRaw: 'new-raw' });
    (mockUsers.findById as jest.Mock).mockResolvedValue(null);

    await expect(svc.refresh('old-raw-token')).rejects.toThrow(UnauthorizedException);
  });

  it('throws UNAUTHENTICATED error code when user not found', async () => {
    const { svc, mockTokens, mockUsers } = makeService();
    (mockTokens.rotateRefreshToken as jest.Mock).mockResolvedValue({ sub: 'user-1', newRaw: 'new-raw' });
    (mockUsers.findById as jest.Mock).mockResolvedValue(null);

    try {
      await svc.refresh('old-raw-token');
    } catch (e) {
      const ex = e as UnauthorizedException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('UNAUTHENTICATED');
    }
  });

  it('calls assertNotBlocked after finding user', async () => {
    const { svc, mockTokens, mockUsers } = makeService();
    const user = makeUser();
    (mockTokens.rotateRefreshToken as jest.Mock).mockResolvedValue({ sub: 'user-1', newRaw: 'new-raw' });
    (mockUsers.findById as jest.Mock).mockResolvedValue(user);
    (mockUsers.assertNotBlocked as jest.Mock).mockReturnValue(undefined);
    (mockTokens.issueAccessToken as jest.Mock).mockReturnValue('new-access');

    await svc.refresh('old-raw-token');

    expect(mockUsers.assertNotBlocked).toHaveBeenCalledWith(user);
  });

  it('returns new accessToken and newRefreshToken on success', async () => {
    const { svc, mockTokens, mockUsers } = makeService();
    (mockTokens.rotateRefreshToken as jest.Mock).mockResolvedValue({ sub: 'user-1', newRaw: 'new-raw' });
    (mockUsers.findById as jest.Mock).mockResolvedValue(makeUser());
    (mockUsers.assertNotBlocked as jest.Mock).mockReturnValue(undefined);
    (mockTokens.issueAccessToken as jest.Mock).mockReturnValue('new-access');

    const result = await svc.refresh('old-raw-token');

    expect(result).toEqual({ accessToken: 'new-access', newRefreshToken: 'new-raw' });
  });
});

// ── logout ────────────────────────────────────────────────────────────────────

describe('UserAuthService.logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls revokeRefreshToken with the raw token and user role', async () => {
    const { svc, mockTokens } = makeService();
    (mockTokens.revokeRefreshToken as jest.Mock).mockResolvedValue(undefined);

    await svc.logout('raw-refresh-token');

    expect(mockTokens.revokeRefreshToken).toHaveBeenCalledWith('raw-refresh-token', 'user');
  });

  it('resolves without throwing on success', async () => {
    const { svc, mockTokens } = makeService();
    (mockTokens.revokeRefreshToken as jest.Mock).mockResolvedValue(undefined);

    await expect(svc.logout('raw-refresh-token')).resolves.toBeUndefined();
  });
});
