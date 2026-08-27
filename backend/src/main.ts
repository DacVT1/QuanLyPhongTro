import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = (
    process.env.CORS_ORIGINS ||
    'http://localhost:5173,http://127.0.0.1:5173,https://quan-ly-phong-tro-eight.vercel.app'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  const storageDir =
    process.env.STORAGE_DIR ||
    join(process.cwd(), 'uploads');

  app.use(
    '/uploads',
    express.static(storageDir),
  );

  // Railway provides process.env.PORT in production.
  const port = process.env.PORT ?? 3000;

  await app.listen(port, '0.0.0.0');

  console.log(`Backend running on port ${port}`);
  console.log(`CORS origins: ${corsOrigins.join(', ')}`);
  console.log(`Storage directory: ${storageDir}`);
}

bootstrap();
