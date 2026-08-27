import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * ==========================================
   * 1. Prefix cho toàn bộ API
   * ==========================================
   *
   * Ví dụ:
   * GET /api/rooms
   * POST /api/auth/login
   */
  app.setGlobalPrefix('api');

  /**
   * ==========================================
   * 2. Validation
   * ==========================================
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /**
   * ==========================================
   * 3. CORS
   * ==========================================
   *
   * Local:
   *   http://localhost:5173
   *   http://127.0.0.1:5173
   *
   * Production:
   *   https://nhatro.vn
   *   https://www.nhatro.vn
   *
   * Có thể cấu hình qua:
   *
   * CORS_ORIGINS=https://nhatro.vn,https://www.nhatro.vn
   */
  const corsOrigins = (
    process.env.CORS_ORIGINS ||
    'http://localhost:5173,http://127.0.0.1:5173'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  /**
   * ==========================================
   * 4. Static files
   * ==========================================
   *
   * Local:
   *   ./uploads
   *
   * Railway:
   *   /data/uploads
   *
   * Cấu hình bằng:
   *
   * STORAGE_DIR=/data/uploads
   */
  const storageDir =
    process.env.STORAGE_DIR ||
    join(process.cwd(), 'uploads');

  app.use(
    '/uploads',
    express.static(storageDir),
  );

  /**
   * ==========================================
   * 5. PORT
   * ==========================================
   *
   * Railway tự cấp process.env.PORT.
   *
   * Local:
   *   PORT không có → 3000
   *
   * Railway:
   *   PORT = Railway cấp
   */
  const port = process.env.PORT ?? 3000;

  /**
   * ==========================================
   * 6. Listen
   * ==========================================
   */
  await app.listen(port, '0.0.0.0');

  console.log(
    `Backend running on http://localhost:${port}`,
  );

  console.log(
    `CORS origins: ${corsOrigins.join(', ')}`,
  );

  console.log(
    `Storage directory: ${storageDir}`,
  );
}

bootstrap();