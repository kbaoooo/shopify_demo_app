import { Module } from '@nestjs/common';
import { EditService, FindService } from 'src/shared/services';
import { ShopifyAuthController } from './shopify-auth.controller';
import { ShopifyAuthService } from './shopify-auth.service';

@Module({
  providers: [ShopifyAuthService, EditService, FindService],
  controllers: [ShopifyAuthController],
  exports: [ShopifyAuthService],
})
export class ShopifyAuthModule {}
