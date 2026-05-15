import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../redis/redis.service';

export const STEP_UP_ACTION_KEY = 'stepUpAction';
export const StepUpAction = (action: string) =>
  Reflect.metadata(STEP_UP_ACTION_KEY, action);

@Injectable()
export class StepUpRequiredGuard implements CanActivate {
  constructor(
    private readonly redis: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Record<string, unknown> & { headers: Record<string, string | string[] | undefined>; user?: { sub?: string } }>();
    const token = req.headers['x-step-up-token'];
    if (!token || typeof token !== 'string') {
      throw new ForbiddenException({ error: 'STEP_UP_REQUIRED', message: 'Step-up token required' });
    }

    const raw = await this.redis.getClient().get(`stepup-token:${token}`);
    if (!raw) {
      throw new ForbiddenException({ error: 'STEP_UP_REQUIRED', message: 'Step-up token invalid or expired' });
    }

    const record = JSON.parse(raw) as { ownerId: string; action: string };
    const requiredAction = this.reflector.get<string>(STEP_UP_ACTION_KEY, ctx.getHandler());

    if (requiredAction && record.action !== requiredAction) {
      throw new ForbiddenException({ error: 'STEP_UP_REQUIRED', message: 'Step-up token action mismatch' });
    }

    // Single use — delete after consuming
    await this.redis.getClient().del(`stepup-token:${token}`);

    return true;
  }
}
