import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';   // ← Built-in NestJS ConfigService
import * as dotenv from 'dotenv';
import { GlobalValidationPipe } from './core/global-validation.pipe';
import { AllExceptionsFilter } from './core/exceptions.filter';
import { BackgroundNotificationService } from './integration/background-notification.service';
import { AppConfigService } from './core/entities/app-config/app-config.service';

async function bootstrap() {
  dotenv.config();

    const app = await NestFactory.create(AppModule);

  const configService = app.get(AppConfigService);   // ← Built-in one

  const port = configService.getFromEnv<number>('SERVER_PORT') || 3000;

  app.useGlobalPipes(GlobalValidationPipe);
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Start background service
  // app.get(BackgroundNotificationService);

  console.log(`🚀 Starting ai-home server on port ${port}...`);

  await app.listen(port);

  console.log(`✅ ai-home server is running at http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});