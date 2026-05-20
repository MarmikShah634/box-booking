import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { ActorRole } from '../decorators/roles.decorator';
import type { JwtPayload } from '../../auth/jwt.strategy';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeContext(user: JwtPayload | undefined, _requiredRoles: ActorRole[] | undefined): ExecutionContext {
  const mockGetHandler = jest.fn();
  const mockGetClass = jest.fn();
  const mockGetRequest = jest.fn().mockReturnValue({ user });

  return {
    getHandler: mockGetHandler,
    getClass: mockGetClass,
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: mockGetRequest,
    }),
  } as unknown as ExecutionContext;
}

function makeReflector(requiredRoles: ActorRole[] | undefined): Reflector {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);
  return reflector;
}

function makeGuard(requiredRoles: ActorRole[] | undefined) {
  const reflector = makeReflector(requiredRoles);
  const guard = new RolesGuard(reflector);
  return guard;
}

function makeJwtPayload(typ: ActorRole): JwtPayload {
  return {
    sub: 'some-id',
    typ,
    jti: 'jti-1',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
  };
}

// ── RolesGuard ────────────────────────────────────────────────────────────────

describe('RolesGuard', () => {
  describe('when no @Roles decorator is present', () => {
    it('allows the request through (returns true)', () => {
      const guard = makeGuard(undefined);
      const ctx = makeContext(makeJwtPayload('user'), undefined);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows the request even with no user on request', () => {
      const guard = makeGuard(undefined);
      const ctx = makeContext(undefined, undefined);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows the request when required roles array is empty', () => {
      const guard = makeGuard([]);
      const ctx = makeContext(makeJwtPayload('user'), []);

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('when @Roles requires a specific role', () => {
    it('allows request when user role matches required role', () => {
      const guard = makeGuard(['user']);
      const ctx = makeContext(makeJwtPayload('user'), ['user']);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows request when user is super_admin and super_admin is required', () => {
      const guard = makeGuard(['super_admin']);
      const ctx = makeContext(makeJwtPayload('super_admin'), ['super_admin']);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('allows request when user role is in a list of required roles', () => {
      const guard = makeGuard(['user', 'owner']);
      const ctx = makeContext(makeJwtPayload('owner'), ['user', 'owner']);

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws ForbiddenException when user role does not match required role', () => {
      const guard = makeGuard(['super_admin']);
      const ctx = makeContext(makeJwtPayload('user'), ['super_admin']);

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException with FORBIDDEN error code on role mismatch', () => {
      const guard = makeGuard(['super_admin']);
      const ctx = makeContext(makeJwtPayload('owner'), ['super_admin']);

      try {
        guard.canActivate(ctx);
      } catch (e) {
        const ex = e as ForbiddenException;
        const body = ex.getResponse() as Record<string, unknown>;
        expect(body['error']).toBe('FORBIDDEN');
      }
    });

    it('throws ForbiddenException when there is no user on the request', () => {
      const guard = makeGuard(['user']);
      const ctx = makeContext(undefined, ['user']);

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException with FORBIDDEN error when user is missing', () => {
      const guard = makeGuard(['owner']);
      const ctx = makeContext(undefined, ['owner']);

      try {
        guard.canActivate(ctx);
      } catch (e) {
        const ex = e as ForbiddenException;
        const body = ex.getResponse() as Record<string, unknown>;
        expect(body['error']).toBe('FORBIDDEN');
      }
    });

    it('uses ROLES_KEY constant to retrieve metadata', () => {
      const reflector = new Reflector();
      const getAllAndOverrideSpy = jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['user'] as ActorRole[]);
      const guard = new RolesGuard(reflector);
      const ctx = makeContext(makeJwtPayload('user'), ['user']);

      guard.canActivate(ctx);

      expect(getAllAndOverrideSpy).toHaveBeenCalledWith(
        ROLES_KEY,
        expect.any(Array),
      );
    });
  });
});
