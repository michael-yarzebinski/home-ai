import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const LoginSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(4).regex(/^\d+$/, 'Code must be numeric'),
});
type LoginDto = z.infer<typeof LoginSchema>;

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  login(@Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto) {
    return this.authService.login(dto.name, dto.code);
  }
}
