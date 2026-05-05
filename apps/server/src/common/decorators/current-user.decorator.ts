import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../../core/auth/jwt.strategy';

/**
 * Extracts the authenticated user from the request.
 * Usage: @CurrentUser() user: AuthUser
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);
