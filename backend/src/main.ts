import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
import { Request } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOriginWhiteList = process.env.CORS_ORIGINS?.split(',') || [];

  app.use((req: Request, _res, next) => {
    console.log('REQ:', req.method, req.originalUrl);
    next();
  });

  app.enableCors({
    origin: corsOriginWhiteList,
    credentials: true,
  });

  // Set global prefix for all routes: url will be /api/v1/...
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(
      `Backend is running on http://localhost:${process.env.PORT ?? 3000}`,
    );
  });
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
