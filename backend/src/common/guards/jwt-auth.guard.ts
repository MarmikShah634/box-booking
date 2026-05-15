import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtPayload } from '../../auth/jwt.strategy';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(ctx: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(ctx);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override handleRequest<TUser = JwtPayload>(err: Error | null, user: TUser | false): TUser {
    if (err ?? !user) {
      throw err ?? new UnauthorizedException({ error: 'UNAUTHENTICATED', message: 'Missing or invalid token' });
    }
    return user;
  }
}
