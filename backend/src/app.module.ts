import { Module } from '@nestjs/common';
import { CoundownTimerModule } from './coundown-timer/coundown-timer.module';
import { PrismaModule } from './prisma/prisma.module';
import { ShopifyAuthModule } from './shopify-auth/shopify-auth.module';

@Module({
  imports: [PrismaModule, ShopifyAuthModule, CoundownTimerModule],
})
export class AppModule {}
