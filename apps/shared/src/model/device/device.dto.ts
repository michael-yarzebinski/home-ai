import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** One rule for when/how to notify about this device (stored in `notification_guidance` jsonb). */
export class NotificationGuidanceRuleDto {
  @IsOptional()
  @IsString()
  entityPattern?: string;

  @IsBoolean()
  enabled!: boolean;

  @IsString()
  @IsNotEmpty()
  instruction!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rolesToNotify?: string[];
}

export class DeviceDto {
  id!: string;
  deviceIdSlug!: string;
  friendlyName!: string;
  haEntityId?: string | null;
  notificationGuidance!: NotificationGuidanceRuleDto[];
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationGuidanceRuleDto)
  notificationGuidance?: NotificationGuidanceRuleDto[];

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationGuidanceRuleDto)
  notificationGuidance?: NotificationGuidanceRuleDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
