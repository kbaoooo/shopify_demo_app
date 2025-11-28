import { Module } from '@nestjs/common';
import { ShopifyAuthController } from './shopify-auth.controller';
import { ShopifyAuthService } from './shopify-auth.service';

@Module({
  providers: [ShopifyAuthService],
  controllers: [ShopifyAuthController],
})
export class ShopifyAuthModule {}
