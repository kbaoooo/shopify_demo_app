import { Module } from '@nestjs/common';
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
  ],
})
export class AppModule {}
