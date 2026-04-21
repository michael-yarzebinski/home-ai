import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { Public } from './decorators/public.decorator';
import { CreateSessionDto } from '@home-ai/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: CreateSessionDto) {
    return this.authService.login(body.name, body.accessCode);
  }
}
