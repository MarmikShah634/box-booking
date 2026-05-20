import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../../auth/jwt.strategy';

export const CurrentAdmin = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtPayload => {
  const req = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
  return req.user;
});
