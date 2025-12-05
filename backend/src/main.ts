import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Log tất cả request
  app.use((req, _res, next) => {
    console.log('[BE] REQ:', req.method, req.originalUrl);
    next();
  });

  // Prefix cho toàn bộ controller -> /api/v1/...
  app.setGlobalPrefix('api/v1');

  // Chuẩn hóa whitelist từ .env (nếu có)
  const envWhitelist = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const isEnvWhitelisted = envWhitelist.includes(origin);

      const isShopifyStorefront =
        /^https:\/\/[a-zA-Z0-9-]+\.myshopify\.com$/.test(origin);

      if (isEnvWhitelisted || isShopifyStorefront) {
        // OK
        return callback(null, true);
      }

      console.warn('[CORS] Blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type,Authorization,X-Shop-Domain,X-Requested-With,Accept',
  });

  await app.listen(process.env.PORT ?? 3000, () => {
    console.log(
      `Backend is running on http://localhost:${process.env.PORT ?? 3000}`,
    );
  });
}

bootstrap();
