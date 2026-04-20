import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class FactDto {
  id!: string;
  key!: string;
  value!: string;
  ownerUserId?: string | null;
  visibleToRoles!: string[];
  createdAt!: string;
  updatedAt!: string;
}

export class FactCreateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  key!: string;

  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsOptional()
  @IsString()
  ownerUserId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visibilityRoles?: string[];
}

export class FactUpdateDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  key?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  ownerUserId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visibleToRoles?: string[];
}
