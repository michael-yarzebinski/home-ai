import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RecipeDto {
  id!: string;
  readableId!: number;
  title!: string;
  sourceUrl!: string;
  pdfPath!: string;
  rawText?: string | null;
  metadata!: Record<string, unknown>;
  active!: boolean;
  createdAt!: string;
  updatedAt!: string;
}

export class RecipeCreateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title!: string;

  @IsString()
  @IsNotEmpty()
  sourceUrl!: string;

  @IsString()
  @IsNotEmpty()
  pdfPath!: string;

  @IsOptional()
  @IsString()
  rawText?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class RecipeUpdateDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  pdfPath?: string;

  @IsOptional()
  @IsString()
  rawText?: string | null;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
