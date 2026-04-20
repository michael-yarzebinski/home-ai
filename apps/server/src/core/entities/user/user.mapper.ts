import { UserCreateDto, UserDto, UserUpdateDto } from '@home-ai/shared';
import { User } from './user.domain';

function toIso(d: Date): string {
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

export function toUserDto(user: User): UserDto {
  const dto = new UserDto();
  dto.id = user.id;
  dto.name = user.name;
  dto.role = user.role;
  dto.messagingId = user.messagingId ?? '';
  dto.quietStart = user.quietStart ?? null;
  dto.quietEnd = user.quietEnd ?? null;
  dto.active = user.active;
  dto.createdAt = toIso(user.createdAt);
  dto.updatedAt = toIso(user.updatedAt);
  return dto;
}

export function fromCreateDto(dto: UserCreateDto): Partial<User> & { accessCode: string } {
  const messagingId = dto.messagingId?.trim() ?? '';
  const out: Partial<User> & { accessCode: string } = {
    name: dto.name,
    role: dto.role,
    messagingId,
    accessCode: dto.accessCode,
  };
  if (dto.quietStart != null) {
    out.quietStart = dto.quietStart;
  }
  if (dto.quietEnd != null) {
    out.quietEnd = dto.quietEnd;
  }
  return out;
}

export function fromUpdateDto(dto: UserUpdateDto): Partial<User> & { accessCode?: string } {
  const out: Partial<User> & { accessCode?: string } = {};
  if (dto.name !== undefined) {
    out.name = dto.name;
  }
  if (dto.role !== undefined) {
    out.role = dto.role;
  }
  if (dto.messagingId !== undefined) {
    out.messagingId = dto.messagingId.trim();
  }
  if (dto.active !== undefined) {
    out.active = dto.active;
  }
  if (dto.quietStart !== undefined) {
    out.quietStart = dto.quietStart;
  }
  if (dto.quietEnd !== undefined) {
    out.quietEnd = dto.quietEnd;
  }
  if (dto.accessCode != null && String(dto.accessCode).trim() !== '') {
    out.accessCode = dto.accessCode.trim();
  }
  return out;
}
