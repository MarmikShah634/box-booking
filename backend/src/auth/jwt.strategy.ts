import { Injectable, OnModuleInit } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  typ: 'user' | 'owner' | 'super_admin';
  jti: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') implements OnModuleInit {
  constructor(config: ConfigService) {
    const pubB64 = config.getOrThrow<string>('JWT_PUBLIC_KEY_BASE64');
    // Key stored as base64(PEM) — decode to PEM string
    const pem = Buffer.from(pubB64, 'base64').toString('utf8');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: pem,
      algorithms: ['RS256'],
    });
  }

  onModuleInit() {}

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
