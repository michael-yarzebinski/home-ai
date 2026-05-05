import { SetMetadata } from '@nestjs/common';
import { Role } from '@home-ai/shared/domain/role/role';

export const ROLES_KEY = 'roles';

/**
 * Marks a controller or route as requiring specific roles.
 * Enforced by RolesGuard once JWT auth is wired up.
 * Usage: @Roles(Role.ADMIN)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
