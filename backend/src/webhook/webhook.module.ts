import { Module } from '@nestjs/common';
import { ShopifyAuthModule } from 'src/shopify-auth/shopify-auth.module';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  imports: [ShopifyAuthModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
