import type { UserDto } from '@home-ai/shared';

/** User returned from admin API (no `accessCodeHash`). Dates are ISO strings over JSON. */
export type UserPublic = UserDto;
