import { SetMetadata } from '@nestjs/common';
export type ActorRole = 'user' | 'owner' | 'super_admin';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: ActorRole[]) => SetMetadata(ROLES_KEY, roles);
