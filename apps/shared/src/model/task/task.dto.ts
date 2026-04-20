import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class TaskDto {
  taskName!: string;
  description!: string;
  requestRoles!: string[];
  executeRoles!: string[];
  notifyRoles!: string[];
  parameters?: Record<string, unknown> | null;
  active!: boolean;
  version!: number;
  createdAt!: string;
  updatedAt!: string;
}

export class TaskUpdateDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requestRoles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  executeRoles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notifyRoles?: string[];

  @IsOptional()
  @IsObject()
  parameters?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  version?: number;
}
