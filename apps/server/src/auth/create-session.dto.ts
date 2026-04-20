import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(1, { message: 'name is required' })
  name!: string;

  @IsString()
  @MinLength(1, { message: 'accessCode is required' })
  accessCode!: string;
}