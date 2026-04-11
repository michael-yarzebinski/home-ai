import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';   // ← Built-in NestJS ConfigService
import * as dotenv from 'dotenv';
import { GlobalValidationPipe } from './common/global-validation.pipe';
import { AllExceptionsFilter } from './common/exceptions.filter';
import { BackgroundNotificationService } from './modules/notifications/background-notification.service';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);   // ← Built-in one

  const port = configService.get<number>('SERVER_PORT') || 3000;

  app.useGlobalPipes(GlobalValidationPipe);
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Start background service
  app.get(BackgroundNotificationService);

  console.log(`🚀 Starting ai-home server on port ${port}...`);

  await app.listen(port);

  console.log(`✅ ai-home server is running at http://localhost:${port}`);
  console.log(`📊 Admin endpoints: http://localhost:${port}/api/admin`);
  console.log(`🔌 Device webhook: http://localhost:${port}/api/webhook/device-event`);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});