import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
import { AppModule } from './app.module';
import { Request } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use((req: Request, _res, next) => {
    console.log('REQ:', req.method, req.originalUrl);
    next();
  });

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Set global prefix for all routes: url will be /api/v1/...
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  await app.listen(process.env.PORT ?? 3000);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
