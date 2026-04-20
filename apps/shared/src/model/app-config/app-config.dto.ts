import { Allow, IsDefined, IsOptional, IsString } from 'class-validator';

/** GET response — includes timestamps as ISO strings on the wire. */
export class AppConfigDto {
  id!: string;
  key!: string;
  value!: unknown;
  description?: string | null;
  active!: boolean;
  createdAt!: string;
  updatedAt!: string;
}

/** PATCH /admin/app-config/:key body */
export class AppConfigUpdateValueDto {
  @IsDefined()
  @Allow()
  value: unknown;

  @IsOptional()
  @IsString()
  description?: string;
}

