import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { OwnerAuthService } from './owner-auth.service';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../prisma/prisma.service';
import type { RedisService } from '../../redis/redis.service';
import type { HashService } from '../../crypto/hash.service';
import type { TokenService } from '../token.service';
import type { Owner } from '@prisma/client';

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

  const mockConfig = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  } as unknown as ConfigService;

  const mockPrisma = {
    owner: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;

  const mockRedis = {
    getClient: jest.fn().mockReturnValue(redisClient),
  } as unknown as RedisService;

  const mockHash = {
    hash: jest.fn(),
    verify: jest.fn(),
  } as unknown as HashService;

  const mockTokens = {
    issueAccessToken: jest.fn(),
    issueRefreshToken: jest.fn(),
    rotateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    revokeAllForSubject: jest.fn(),
  } as unknown as TokenService;

  const svc = new OwnerAuthService(mockConfig, mockPrisma, mockRedis, mockHash, mockTokens);

  return { svc, redisClient, mockConfig, mockPrisma, mockRedis, mockHash, mockTokens };
}

function makeOwner(overrides: Partial<Owner> = {}): Owner {
  return {
    id: 'owner-1',
    email: 'owner@example.com',
    passwordHash: '$2b$10$hashedpassword',
    name: 'Test Owner',
    phone: '+919876543210',
    isSuspended: false,
    kycStatus: 'PENDING',
    subscriptionStatus: 'INACTIVE',
    razorpayKeyId: null,
    razorpayKeySecretEnc: null,
    razorpayWebhookSecretEnc: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Owner;
}

// ── register ──────────────────────────────────────────────────────────────────

describe('OwnerAuthService.register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws VALIDATION_ERROR for weak password', async () => {
    const { svc } = makeService();

    await expect(svc.register('test@example.com', 'weak', 'Name', '+91123')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws CONFLICT if email already registered', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwner());

    await expect(
      svc.register('owner@example.com', 'StrongPass1234', 'Name', '+91123'),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns ownerId on successful registration', async () => {
    const { svc, mockPrisma, mockHash } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(null);
    (mockHash.hash as jest.Mock).mockResolvedValue('hashed');
    (mockPrisma.owner.create as jest.Mock).mockResolvedValue(makeOwner({ id: 'new-owner' }));

    const result = await svc.register('new@example.com', 'StrongPass1234', 'Name', '+91123');
    expect(result).toEqual({ ownerId: 'new-owner' });
  });
});

// ── login ─────────────────────────────────────────────────────────────────────

describe('OwnerAuthService.login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws UNAUTHENTICATED if owner not found', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(svc.login('missing@example.com', 'SomePass123')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UNAUTHENTICATED if owner has no passwordHash', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwner({ passwordHash: null as unknown as string }));

    await expect(svc.login('owner@example.com', 'SomePass123')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UNAUTHENTICATED error code when owner not found', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(null);

    try {
      await svc.login('missing@example.com', 'SomePass123');
    } catch (e) {
      const ex = e as UnauthorizedException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('UNAUTHENTICATED');
    }
  });

  it('throws FORBIDDEN if account is suspended', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwner({ isSuspended: true }));

    await expect(svc.login('owner@example.com', 'SomePass123')).rejects.toThrow(ForbiddenException);
  });

  it('throws FORBIDDEN error code for suspended account', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwner({ isSuspended: true }));

    try {
      await svc.login('owner@example.com', 'SomePass123');
    } catch (e) {
      const ex = e as ForbiddenException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('FORBIDDEN');
    }
  });

  it('throws UNAUTHENTICATED if password does not match', async () => {
    const { svc, mockPrisma, mockHash } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwner());
    (mockHash.verify as jest.Mock).mockResolvedValue(false);

    await expect(svc.login('owner@example.com', 'WrongPass123')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('returns owner, accessToken, and refreshToken on success', async () => {
    const { svc, mockPrisma, mockHash, mockTokens } = makeService();
    const owner = makeOwner();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(owner);
    (mockHash.verify as jest.Mock).mockResolvedValue(true);
    (mockTokens.issueAccessToken as jest.Mock).mockReturnValue('access-token');
    (mockTokens.issueRefreshToken as jest.Mock).mockResolvedValue('refresh-token');

    const result = await svc.login('owner@example.com', 'CorrectPass1');

    expect(result).toMatchObject({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    expect(result.owner).toMatchObject({ id: owner.id, email: owner.email });
  });

  it('sanitizes owner response (omits passwordHash)', async () => {
    const { svc, mockPrisma, mockHash, mockTokens } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwner());
    (mockHash.verify as jest.Mock).mockResolvedValue(true);
    (mockTokens.issueAccessToken as jest.Mock).mockReturnValue('at');
    (mockTokens.issueRefreshToken as jest.Mock).mockResolvedValue('rt');

    const result = await svc.login('owner@example.com', 'CorrectPass1');

    expect((result.owner as Record<string, unknown>)['passwordHash']).toBeUndefined();
  });
});

// ── forgotPassword ─────────────────────────────────────────────────────────────

describe('OwnerAuthService.forgotPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not throw if email is not found (prevents enumeration)', async () => {
    const { svc, mockPrisma } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(svc.forgotPassword('unknown@example.com')).resolves.toBeUndefined();
  });

  it('stores reset token in Redis with 1 hour TTL when owner found', async () => {
    const { svc, mockPrisma, redisClient, mockConfig } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwner());
    (mockConfig.get as jest.Mock).mockReturnValue('development');
    redisClient.setex.mockResolvedValue('OK');

    await svc.forgotPassword('owner@example.com');

    const setexCalls = (redisClient.setex).mock.calls;
    expect(setexCalls.length).toBeGreaterThan(0);
    const resetCall = setexCalls.find(
      (c: unknown[]) => typeof c[0] === 'string' && c[0].startsWith('reset-password:owner:'),
    );
    expect(resetCall).toBeDefined();
    expect(resetCall![1]).toBe(3600); // 1 hour
  });

  it('stores ownerId as value in Redis reset token', async () => {
    const { svc, mockPrisma, redisClient, mockConfig } = makeService();
    const owner = makeOwner({ id: 'owner-123' });
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(owner);
    (mockConfig.get as jest.Mock).mockReturnValue('development');
    redisClient.setex.mockResolvedValue('OK');

    await svc.forgotPassword('owner@example.com');

    const setexCalls = (redisClient.setex).mock.calls;
    const resetCall = setexCalls.find(
      (c: unknown[]) => typeof c[0] === 'string' && c[0].startsWith('reset-password:owner:'),
    );
    expect(resetCall![2]).toBe('owner-123');
  });

  it('logs token in development', async () => {
    const { svc, mockPrisma, redisClient, mockConfig } = makeService();
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwner());
    (mockConfig.get as jest.Mock).mockReturnValue('development');
    redisClient.setex.mockResolvedValue('OK');

    const logSpy = jest.spyOn(
      (svc as unknown as { logger: { log: jest.Mock } }).logger,
      'log',
    );

    await svc.forgotPassword('owner@example.com');

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[DEV]'));
  });
});

// ── resetPassword ─────────────────────────────────────────────────────────────

describe('OwnerAuthService.resetPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws INVALID_TOKEN if token not found in Redis', async () => {
    const { svc, redisClient } = makeService();
    redisClient.get.mockResolvedValue(null);

    await expect(svc.resetPassword('invalid-token', 'NewStrongPass1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws INVALID_TOKEN error code when token missing', async () => {
    const { svc, redisClient } = makeService();
    redisClient.get.mockResolvedValue(null);

    try {
      await svc.resetPassword('bad-token', 'NewStrongPass1');
    } catch (e) {
      const ex = e as BadRequestException;
      const body = ex.getResponse() as Record<string, unknown>;
      expect(body['error']).toBe('INVALID_TOKEN');
    }
  });

  it('throws VALIDATION_ERROR for weak new password', async () => {
    const { svc, redisClient } = makeService();
    redisClient.get.mockResolvedValue('owner-1');

    await expect(svc.resetPassword('valid-token', 'weak')).rejects.toThrow(BadRequestException);
  });

  it('hashes new password and updates owner on success', async () => {
    const { svc, redisClient, mockHash, mockPrisma, mockTokens } = makeService();
    redisClient.get.mockResolvedValue('owner-1');
    redisClient.del.mockResolvedValue(1);
    (mockHash.hash as jest.Mock).mockResolvedValue('new-hashed-password');
    (mockPrisma.owner.update as jest.Mock).mockResolvedValue(makeOwner());
    (mockTokens.revokeAllForSubject as jest.Mock).mockResolvedValue(undefined);

    await svc.resetPassword('valid-token', 'NewStrongPass1');

    expect(mockHash.hash).toHaveBeenCalledWith('NewStrongPass1');
    expect(mockPrisma.owner.update).toHaveBeenCalledWith({
      where: { id: 'owner-1' },
      data: { passwordHash: 'new-hashed-password' },
    });
  });

  it('deletes reset token from Redis after successful reset', async () => {
    const { svc, redisClient, mockHash, mockPrisma, mockTokens } = makeService();
    redisClient.get.mockResolvedValue('owner-1');
    redisClient.del.mockResolvedValue(1);
    (mockHash.hash as jest.Mock).mockResolvedValue('new-hash');
    (mockPrisma.owner.update as jest.Mock).mockResolvedValue(makeOwner());
    (mockTokens.revokeAllForSubject as jest.Mock).mockResolvedValue(undefined);

    await svc.resetPassword('valid-token', 'NewStrongPass1');

    expect(redisClient.del).toHaveBeenCalledWith('reset-password:owner:valid-token');
  });

  it('revokes all refresh tokens for owner after reset', async () => {
    const { svc, redisClient, mockHash, mockPrisma, mockTokens } = makeService();
    redisClient.get.mockResolvedValue('owner-1');
    redisClient.del.mockResolvedValue(1);
    (mockHash.hash as jest.Mock).mockResolvedValue('new-hash');
    (mockPrisma.owner.update as jest.Mock).mockResolvedValue(makeOwner());
    (mockTokens.revokeAllForSubject as jest.Mock).mockResolvedValue(undefined);

    await svc.resetPassword('valid-token', 'NewStrongPass1');

    expect(mockTokens.revokeAllForSubject).toHaveBeenCalledWith('owner-1', 'owner');
  });
});

// ── refresh ───────────────────────────────────────────────────────────────────

describe('OwnerAuthService.refresh', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws UNAUTHENTICATED if owner not found after token rotation', async () => {
    const { svc, mockTokens, mockPrisma } = makeService();
    (mockTokens.rotateRefreshToken as jest.Mock).mockResolvedValue({ sub: 'owner-1', newRaw: 'new-raw' });
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(svc.refresh('old-token')).rejects.toThrow(UnauthorizedException);
  });

  it('throws FORBIDDEN if owner is suspended after token rotation', async () => {
    const { svc, mockTokens, mockPrisma } = makeService();
    (mockTokens.rotateRefreshToken as jest.Mock).mockResolvedValue({ sub: 'owner-1', newRaw: 'new-raw' });
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwner({ isSuspended: true }));

    await expect(svc.refresh('old-token')).rejects.toThrow(ForbiddenException);
  });

  it('returns new tokens on success', async () => {
    const { svc, mockTokens, mockPrisma } = makeService();
    (mockTokens.rotateRefreshToken as jest.Mock).mockResolvedValue({ sub: 'owner-1', newRaw: 'new-raw' });
    (mockPrisma.owner.findUnique as jest.Mock).mockResolvedValue(makeOwner());
    (mockTokens.issueAccessToken as jest.Mock).mockReturnValue('new-access');

    const result = await svc.refresh('old-token');
    expect(result).toEqual({ accessToken: 'new-access', newRefreshToken: 'new-raw' });
  });
});

// ── logout ────────────────────────────────────────────────────────────────────

describe('OwnerAuthService.logout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls revokeRefreshToken with owner role', async () => {
    const { svc, mockTokens } = makeService();
    (mockTokens.revokeRefreshToken as jest.Mock).mockResolvedValue(undefined);

    await svc.logout('raw-token');

    expect(mockTokens.revokeRefreshToken).toHaveBeenCalledWith('raw-token', 'owner');
  });
});

// ── verifyStepUp ──────────────────────────────────────────────────────────────

describe('OwnerAuthService.verifyStepUp', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws UNAUTHENTICATED if stored OTP is null', async () => {
    const { svc, redisClient } = makeService();
    redisClient.get.mockResolvedValue(null);

    await expect(svc.verifyStepUp('owner-1', 'delete-venue', '123456')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UNAUTHENTICATED if OTP does not match', async () => {
    const { svc, redisClient } = makeService();
    redisClient.get.mockResolvedValue('999999');

    await expect(svc.verifyStepUp('owner-1', 'delete-venue', '111111')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('returns stepUpToken on correct OTP', async () => {
    const { svc, redisClient } = makeService();
    redisClient.get.mockResolvedValue('123456');
    redisClient.del.mockResolvedValue(1);
    redisClient.setex.mockResolvedValue('OK');

    const result = await svc.verifyStepUp('owner-1', 'delete-venue', '123456');
    expect(result).toHaveProperty('stepUpToken');
    expect(typeof result.stepUpToken).toBe('string');
  });
});
