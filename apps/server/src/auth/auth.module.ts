import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from '../core/core.module';
import { AuthService } from './service/auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { AppConfigService } from '../core/entities/app-config/app-config.service';

@Module({
  imports: [
    CoreModule,
    ConfigModule,
    JwtModule.registerAsync({
      // Dynamic module runs its factory in JwtModule’s context; import CoreModule
      // here so AppConfigService (exported from CoreModule) can be injected.
      imports: [CoreModule],
      useFactory: (config: AppConfigService) => ({
        secret: config.getFromEnv<string>('JWT_SECRET'),
      }),
      inject: [AppConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
