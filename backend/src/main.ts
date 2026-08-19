import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { join } from 'path';
import * as express from 'express';

import { AppModule } from './app.module';
import { seedDatabase } from './database/seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
app.use(
  '/uploads',
  express.static(join(process.cwd(), 'uploads')),
);
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  });

  // ==============================
  // Global API prefix
  // ==============================
  app.setGlobalPrefix('api');

  // ==============================
  // Validation
  // ==============================
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // ==============================
  // Static files - Uploads
  // ==============================
  app.use(
    '/uploads',
    express.static(
      join(process.cwd(), 'uploads'),
    ),
  );

  // ==============================
  // Swagger
  // ==============================
  const config = new DocumentBuilder()
    .setTitle('Quản lý nhà trọ')
    .setDescription(
      'API quản lý nhà trọ, phòng, giường, hợp đồng và hóa đơn',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(
    app,
    config,
  );

  SwaggerModule.setup(
    'api/docs',
    app,
    document,
  );

  // ==============================
  // Database seed
  // ==============================
  const dataSource = app.get(DataSource);

  await seedDatabase(dataSource);

  // ==============================
  // Start server
  // ==============================
  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  console.log(
    `Application is running on: http://localhost:${port}`,
  );

  console.log(
    `Swagger: http://localhost:${port}/api/docs`,
  );

  console.log(
    `Uploads: http://localhost:${port}/uploads/`,
  );
}

bootstrap();