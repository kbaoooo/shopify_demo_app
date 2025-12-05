import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CountdownTimerModule } from './coundown-timer/countdown-timer.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShopifyAuthModule } from './shopify-auth/shopify-auth.module';
import { StorefrontTimerModule } from './storefront-timer/storefront-timer.module';
@Module({
  imports: [
    PrismaModule,
    ShopifyAuthModule,
    CountdownTimerModule,
    StorefrontTimerModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public', 'storefront'),
      serveRoot: '/storefront',
      serveStaticOptions: {
        index: false, // Disable directory indexing
      },
    }),
  ],
})

// ServeStaticModule is used to serve static files from the 'public' directory.
export class AppModule {}
