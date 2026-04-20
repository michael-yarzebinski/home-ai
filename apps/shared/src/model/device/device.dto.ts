import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class DeviceDto {
  id!: string;
  deviceIdSlug!: string;
  friendlyName!: string;
  haEntityId?: string | null;
  notificationGuidance!: Record<string, unknown>;
  visibleToRoles!: string[];
  active!: boolean;
  metadata!: Record<string, unknown>;
  createdAt!: string;
  updatedAt!: string;
}

export class DeviceCreateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  deviceIdSlug!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  friendlyName!: string;

  @IsOptional()
  @IsString()
  haEntityId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visibleToRoles?: string[];

  @IsOptional()
  @IsObject()
  notificationGuidance?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class DeviceUpdateDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  deviceIdSlug?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  friendlyName?: string;

  @IsOptional()
  @IsString()
  haEntityId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visibleToRoles?: string[];

  @IsOptional()
  @IsObject()
  notificationGuidance?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
