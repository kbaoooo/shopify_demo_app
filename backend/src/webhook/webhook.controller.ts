import { Controller, Headers, Post, Req } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('app-uninstalled')
  async handleAppUninstalled(
    @Req() req: Request & { rawBody?: string },
    @Headers('x-shopify-hmac-sha256') hmac: string,
    @Headers('x-shopify-shop-domain') shopDomainHeader: string,
  ) {
    return await this.webhookService.handleAppUninstalled(
      req,
      hmac,
      shopDomainHeader,
    );
  }
}
