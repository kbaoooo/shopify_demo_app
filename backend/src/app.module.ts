import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ShopifyAuthModule } from './shopify-auth/shopify-auth.module';

@Module({
  imports: [PrismaModule, ShopifyAuthModule],
  controllers: [],
})
export class AppModule {}
