import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { HashService } from '../crypto/hash.service';
import { randomBytes } from 'crypto';
import { ActorRole } from '../common/decorators/roles.decorator';
import { JwtPayload } from './jwt.strategy';
import { randomUUID } from 'crypto';
import type { Response as Res } from 'express';

const SUBJECT_FIELD: Record<ActorRole, string> = {
  user: 'userId',
  owner: 'ownerId',
  super_admin: 'adminId',
};

interface RefreshTokenRecord {
  id: string
  tokenHash: string
  revokedAt: Date | null
  expiresAt: Date
  [key: string]: unknown
}

interface RefreshTokenDelegate {
  create(args: { data: Record<string, unknown> }): Promise<RefreshTokenRecord>
  findMany(args: {
    where: Record<string, unknown>
    orderBy?: Record<string, unknown>
    take?: number
  }): Promise<RefreshTokenRecord[]>
  update(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<RefreshTokenRecord>
  updateMany(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<unknown>
}

@Injectable()
export class TokenService implements OnModuleInit {
  private privateKeyPem!: string;
  private accessTtl!: number;
  private refreshTtl!: number;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly hash: HashService,
  ) {}

  onModuleInit() {
    const privB64 = this.config.getOrThrow<string>('JWT_PRIVATE_KEY_BASE64');
    this.privateKeyPem = Buffer.from(privB64, 'base64').toString('utf8');
    this.accessTtl = Number(this.config.get('JWT_ACCESS_TTL_SECONDS')) || 900;
    this.refreshTtl = Number(this.config.get('JWT_REFRESH_TTL_SECONDS')) || 2592000;
  }

  private getTable(typ: ActorRole): RefreshTokenDelegate {
    switch (typ) {
      case 'user': return this.prisma.userRefreshToken;
      case 'owner': return this.prisma.ownerRefreshToken;
      case 'super_admin': return this.prisma.superAdminRefreshToken;
    }
  }

  issueAccessToken(sub: string, typ: ActorRole): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = { sub, typ, jti: randomUUID() };
    return this.jwt.sign(payload, {
      algorithm: 'RS256',
      privateKey: this.privateKeyPem,
      expiresIn: this.accessTtl,
    });
  }

  async issueRefreshToken(sub: string, typ: ActorRole): Promise<string> {
    const raw = randomBytes(32).toString('hex');
    const tokenHash = await this.hash.hash(raw);
    const expiresAt = new Date(Date.now() + this.refreshTtl * 1000);
    const subField = SUBJECT_FIELD[typ];

    await this.getTable(typ).create({
      data: { [subField]: sub, tokenHash, expiresAt },
    });

    return raw;
  }

  async rotateRefreshToken(
    raw: string,
    typ: ActorRole,
  ): Promise<{ sub: string; newRaw: string }> {
    const subField = SUBJECT_FIELD[typ];
    const table = this.getTable(typ);

    const candidates = await table.findMany({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    let matched: RefreshTokenRecord | null = null;
    for (const candidate of candidates) {
      if (await this.hash.verify(candidate.tokenHash, raw)) {
        matched = candidate;
        break;
      }
    }

    if (!matched) {
      throw new UnauthorizedException({ error: 'UNAUTHENTICATED', message: 'Invalid refresh token' });
    }

    await table.update({
      where: { id: matched.id },
      data: { revokedAt: new Date() },
    });

    const sub = matched[subField] as string;
    const newRaw = await this.issueRefreshToken(sub, typ);
    return { sub, newRaw };
  }

  async revokeRefreshToken(raw: string, typ: ActorRole): Promise<void> {
    const table = this.getTable(typ);

    const candidates = await table.findMany({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    for (const candidate of candidates) {
      if (await this.hash.verify(candidate.tokenHash, raw)) {
        await table.update({
          where: { id: candidate.id },
          data: { revokedAt: new Date() },
        });
        return;
      }
    }
  }

  async revokeAllForSubject(sub: string, typ: ActorRole): Promise<void> {
    const subField = SUBJECT_FIELD[typ];
    await this.getTable(typ).updateMany({
      where: { [subField]: sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  setRefreshCookie(res: Res, token: string, typ: ActorRole): void {
    const isProd = this.config.get('NODE_ENV') === 'production';
    res.cookie(`refresh_${typ}`, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: this.refreshTtl * 1000,
      path: `/api/v1/auth/${typ.replace('_', '-')}`,
    });
  }

  clearRefreshCookie(res: Res, typ: ActorRole): void {
    res.clearCookie(`refresh_${typ}`, {
      path: `/api/v1/auth/${typ.replace('_', '-')}`,
    });
  }
}
