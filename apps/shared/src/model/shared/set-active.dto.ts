import { IsBoolean } from 'class-validator';

/** Shared body for active/inactive toggle endpoints. */
export class SetActiveDto {
  @IsBoolean()
  active!: boolean;
}
