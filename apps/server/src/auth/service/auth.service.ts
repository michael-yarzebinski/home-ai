import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../core/entities/user/user.service';
import { toPublicUser, UserPublic } from '../user-public.mapper';
import { JwtPayload } from '../guard/jwt-auth.guard';
import { AppConfigService } from 'src/core/entities/app-config/app-config.service';
import { LogService } from 'src/core/entities/monitoring/log/log.serice';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly appConfigService: AppConfigService,
    private readonly logService: LogService,
  ) {}

  async login(
    displayName: string,
    accessCode: string,
  ): Promise<{ access_token: string; user: UserPublic }> {
    const user = await this.usersService.reader().getByName(displayName);
    if (!user || !user.active) {
      await this.logService.log({
        severity: 'error',
        message: `Attempted login for user ${displayName}.  User is inactive or does not exist`,
      });
      throw new UnauthorizedException('Unknown or inactive user');
    }

    const accessCodeMatch = await this.usersService.verifyAccessCode(user.id, accessCode);
    if (!accessCodeMatch) {
      await this.logService.log({
        severity: 'error',
        message: `Invalid login attempt for ${displayName}.`,
        userId: user.id
      });

      throw new UnauthorizedException('Invalid access code');
    }

    const payload: JwtPayload = { sub: user.id, role: user.role };
    const expiresIn = this.appConfigService.getFromEnv<string>('JWT_EXPIRES_IN') || '8h';
    const access_token = await this.jwtService.signAsync(
      { sub: payload.sub, role: payload.role },
      { expiresIn: expiresIn as `${number}h` | `${number}d` | number },
    );

    await this.logService.log({
      severity: 'info',
      message: `Successful login for ${displayName}.`,
      userId: user.id
    });
    return { access_token, user: toPublicUser(user) };
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token);
  }
}
