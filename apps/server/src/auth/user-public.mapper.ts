import { User } from '../core/entities/user/user.domain';

export type UserPublic = Omit<User, 'accessCodeHash'>;

export function toPublicUser(user: User): UserPublic {
  const { accessCodeHash: _hash, ...rest } = user;
  return rest;
}
