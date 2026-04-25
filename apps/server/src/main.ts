// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,           // automatically transform payloads
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS (adjust origins for production)
  app.enableCors({
    origin: true,                // or specify allowed origins: ['http://localhost:4200']
    credentials: true,
  });

  // Optional: Global prefix for all routes
  // app.setGlobalPrefix('api');

  // Graceful shutdown support
  app.enableShutdownHooks();

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  await app.listen(port);

  Logger.log(`🚀 Home Assistant AI is running on: http://localhost:${port}`, 'Bootstrap');
}

bootstrap().catch((error) => {
  Logger.error('❌ Failed to start application', error, 'Bootstrap');
  throw error;

  process.exit(1);

});