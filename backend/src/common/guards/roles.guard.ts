import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, ActorRole } from '../decorators/roles.decorator';
import { JwtPayload } from '../../auth/jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<ActorRole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const req = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = req.user;
    if (!user || !required.includes(user.typ)) {
      throw new ForbiddenException({ error: 'FORBIDDEN', message: 'Insufficient role' });
    }
    return true;
  }
}
