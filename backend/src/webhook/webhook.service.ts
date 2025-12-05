import { BadRequestException, Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { ShopifyAuthService } from 'src/shopify-auth/shopify-auth.service';

@Injectable()
export class WebhookService {
  constructor(private readonly shopifyAuthService: ShopifyAuthService) {}

  private verifyHmac(rawBody: string, hmacHeader: string | undefined): boolean {
    if (!hmacHeader) return false;
    const secret = process.env.SHOPIFY_API_SECRET ?? '';
    const digest = createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    try {
      const bufferA = Buffer.from(digest, 'utf8');
      const bufferB = Buffer.from(hmacHeader, 'utf8');
      if (bufferA.length !== bufferB.length) return false;
      return timingSafeEqual(bufferA, bufferB);
    } catch (error) {
      console.error('[WEBHOOK] Error verifying HMAC', error);
      return false;
    }
  }

  async handleAppUninstalled(
    req: Request & { rawBody?: string },
    hmac: string,
    shopDomainHeader: string,
  ) {
    const rawBody = req.rawBody || '';
    if (!this.verifyHmac(rawBody, hmac)) {
      console.error('[WEBHOOK] Invalid HMAC for app/uninstalled');
      throw new BadRequestException('Invalid HMAC');
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody || '{}');
    } catch (error) {
      console.error('[WEBHOOK] Cannot parse webhook body', error);
      throw new BadRequestException('Invalid JSON');
    }

    const shopDomain = shopDomainHeader || payload?.shop_domain;
    if (!shopDomain) {
      throw new BadRequestException('Missing shop domain');
    }

    console.log(`[WEBHOOK] App uninstalled for shop: ${shopDomain}`);

    await this.shopifyAuthService.markShopUninstalled(shopDomain);
    return { success: true };
  }
}
