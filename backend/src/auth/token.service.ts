import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { HashService } from '../crypto/hash.service';
import { randomBytes } from 'crypto';
import { ActorRole } from '../common/decorators/roles.decorator';
import { JwtPayload } from './jwt.strategy';
import { randomUUID } from 'crypto';

type TokenTable = 'userRefreshToken' | 'ownerRefreshToken' | 'superAdminRefreshToken';

const TABLE_MAP: Record<ActorRole, TokenTable> = {
  user: 'userRefreshToken',
  owner: 'ownerRefreshToken',
  super_admin: 'superAdminRefreshToken',
};

const SUBJECT_FIELD: Record<ActorRole, string> = {
  user: 'userId',
  owner: 'ownerId',
  super_admin: 'adminId',
};

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
    // Key is stored as base64(PEM) — decode to get the PEM string
    this.privateKeyPem = Buffer.from(privB64, 'base64').toString('utf8');
    this.accessTtl = Number(this.config.get('JWT_ACCESS_TTL_SECONDS')) || 900;
    this.refreshTtl = Number(this.config.get('JWT_REFRESH_TTL_SECONDS')) || 2592000;
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

    const table = TABLE_MAP[typ];
    const subField = SUBJECT_FIELD[typ];
    await (this.prisma[table] as any).create({
      data: { [subField]: sub, tokenHash, expiresAt },
    });

    return raw;
  }

  async rotateRefreshToken(
    raw: string,
    typ: ActorRole,
  ): Promise<{ sub: string; newRaw: string }> {
    const table = TABLE_MAP[typ];
    const subField = SUBJECT_FIELD[typ];

    // Find all non-revoked, non-expired tokens for this type and check each
    const candidates = await (this.prisma[table] as any).findMany({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    let matched: any = null;
    for (const candidate of candidates) {
      if (await this.hash.verify(candidate.tokenHash, raw)) {
        matched = candidate;
        break;
      }
    }

    if (!matched) {
      // Token not found — may be replayed revoked token; revoke all for safety
      // (We can't easily identify the subject without the match, so just reject)
      throw new UnauthorizedException({ error: 'UNAUTHENTICATED', message: 'Invalid refresh token' });
    }

    // Revoke matched token
    await (this.prisma[table] as any).update({
      where: { id: matched.id },
      data: { revokedAt: new Date() },
    });

    const sub: string = matched[subField];
    const newRaw = await this.issueRefreshToken(sub, typ);
    return { sub, newRaw };
  }

  async revokeRefreshToken(raw: string, typ: ActorRole): Promise<void> {
    const table = TABLE_MAP[typ];

    const candidates = await (this.prisma[table] as any).findMany({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    for (const candidate of candidates) {
      if (await this.hash.verify(candidate.tokenHash, raw)) {
        await (this.prisma[table] as any).update({
          where: { id: candidate.id },
          data: { revokedAt: new Date() },
        });
        return;
      }
    }
  }

  async revokeAllForSubject(sub: string, typ: ActorRole): Promise<void> {
    const table = TABLE_MAP[typ];
    const subField = SUBJECT_FIELD[typ];
    await (this.prisma[table] as any).updateMany({
      where: { [subField]: sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  setRefreshCookie(res: any, token: string, typ: ActorRole): void {
    const isProd = this.config.get('NODE_ENV') === 'production';
    res.cookie(`refresh_${typ}`, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: this.refreshTtl * 1000,
      path: `/api/v1/auth/${typ.replace('_', '-')}`,
    });
  }

  clearRefreshCookie(res: any, typ: ActorRole): void {
    res.clearCookie(`refresh_${typ}`, {
      path: `/api/v1/auth/${typ.replace('_', '-')}`,
    });
  }
}
