import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserUtils } from './user.utils';

/** Wire/read model for admin user APIs (ISO date strings). */
export class UserDto {
  id!: string;
  name!: string;
  role!: string;
  messagingId!: string;
  quietStart?: string | null;
  quietEnd?: string | null;
  active!: boolean;
  createdAt!: string;
  updatedAt!: string;
}

/** POST body — no server timestamps. */
export class UserCreateDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Role is required' })
  role!: string;

  @IsOptional()
  @IsString()
  messagingId?: string;

  @IsOptional()
  @Transform(({ value }) => UserUtils.trimQuietCreate(value))
  @ValidateIf((_, v) => v != null)
  @IsString()
  @Matches(UserUtils.quietTimePattern, {
    message: 'Quiet start must be a valid HH:mm time',
  })
  quietStart?: string;

  @IsOptional()
  @Transform(({ value }) => UserUtils.trimQuietCreate(value))
  @ValidateIf((_, v) => v != null)
  @IsString()
  @Matches(UserUtils.quietTimePattern, {
    message: 'Quiet end must be a valid HH:mm time',
  })
  quietEnd?: string;

  @IsString()
  @MinLength(5, { message: 'Access code must be at least 5 characters' })
  accessCode!: string;
}

/** PATCH body — no server timestamps. */
export class UserUpdateDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Role is required' })
  role?: string;

  @IsOptional()
  @IsString()
  messagingId?: string;

  @IsOptional()
  @Transform(({ value }) => UserUtils.trimQuietUpdate(value))
  @ValidateIf((_, v) => v != null)
  @IsString()
  @Matches(UserUtils.quietTimePattern, {
    message: 'Quiet start must be a valid HH:mm time',
  })
  quietStart?: string | null;

  @IsOptional()
  @Transform(({ value }) => UserUtils.trimQuietUpdate(value))
  @ValidateIf((_, v) => v != null)
  @IsString()
  @Matches(UserUtils.quietTimePattern, {
    message: 'Quiet end must be a valid HH:mm time',
  })
  quietEnd?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.accessCode != null && String(o.accessCode).trim() !== '')
  @MinLength(5, { message: 'New access code must be at least 5 characters' })
  accessCode?: string;
}
