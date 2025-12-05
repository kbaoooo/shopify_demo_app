import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Shop } from 'generated/prisma/client';
import { ModelName } from 'generated/prisma/internal/prismaNamespace';
import { EditService, FindService } from 'src/shared/services';

@Injectable()
export class ShopifyAuthService {
  constructor(
    private readonly editService: EditService,
    private readonly findService: FindService,
  ) {}

  async upsertShop(shopDomain: string, accessToken: string) {
    return await this.editService.upsert<Shop>({
      model: ModelName.Shop,
      where: { shopDomain },
      create: { shopDomain, accessToken, isInstalled: true, uninstallAt: null },
      update: { accessToken, isInstalled: true, uninstallAt: null },
    });
  }

  async getShopByDomain(shopDomain: string) {
    return await this.findService.findUniqueBy<Shop>({
      model: ModelName.Shop,
      where: { shopDomain },
    });
  }

  async ensureScriptTag(shopDomain: string, accessToken: string) {
    const apiVersionShopify = process.env.SHOPIFY_API_VERSION || '2024-01';
    const baseUrlShopify = `https://${shopDomain}/admin/api/${apiVersionShopify}`;

    const scriptSrc = `${process.env.SHOPIFY_HOST}/storefront/timer.js`;

    // 1. Kiểm tra đã có script_tag chưa
    // fetch script_tags với src cụ thể, nếu token hết hạn sẽ lỗi 401/403
    const listRes = await axios.get(`${baseUrlShopify}/script_tags.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
      params: { src: scriptSrc },
    });

    if (listRes.data.script_tags?.length) {
      console.log('[SCRIPT_TAG] Already exists for', shopDomain);
      return;
    }

    // 2. Tạo mới
    const payload = {
      script_tag: {
        event: 'onload',
        src: scriptSrc,
      },
    };

    const createRes = await axios.post(
      `${baseUrlShopify}/script_tags.json`,
      payload,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('[SCRIPT_TAG] Created for', shopDomain, createRes.data);
  }

  async ensureAppUninstalledWebhook(shopDomain: string, accessToken: string) {
    const apiVersionShopify = process.env.SHOPIFY_API_VERSION || '2024-01';
    const baseUrlShopify = `https://${shopDomain}/admin/api/${apiVersionShopify}`;
    const address = `${process.env.SHOPIFY_HOST}/api/v1/webhooks/app-uninstalled`;

    // check existing webhooks
    const listRes = await axios.get(`${baseUrlShopify}/webhooks.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
      params: {
        topic: 'app/uninstalled',
      },
    });

    const existing = listRes.data?.webhooks || [];

    const alreadyExists = existing.some((wh) => wh.address === address);

    if (alreadyExists) {
      console.log(
        '[WEBHOOK] App Uninstalled webhook already exists for',
        shopDomain,
      );
      return;
    }
    // create webhook
    const payload = {
      webhook: {
        topic: 'app/uninstalled',
        address,
        format: 'json',
      },
    };

    const createRes = await axios.post(
      `${baseUrlShopify}/webhooks.json`,
      payload,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log(
      '[WEBHOOK] App Uninstalled webhook created for',
      shopDomain,
      createRes.data,
    );
  }

  // mark shop as uninstalled
  async markShopUninstalled(shopDomain: string) {
    const normalizedDomain = shopDomain.endsWith('.myshopify.com')
      ? shopDomain
      : `${shopDomain}.myshopify.com`;

    const shop = await this.findService.findUniqueBy<Shop>({
      model: ModelName.Shop,
      where: { shopDomain: normalizedDomain },
    });

    if (!shop) {
      console.warn(
        '[WEBHOOK] app/uninstalled for unknown shop',
        normalizedDomain,
      );
      return;
    }

    await this.editService.update<Shop>({
      model: ModelName.Shop,
      where: { id: shop.id },
      update: {
        isInstalled: false,
        uninstallAt: new Date(),
      },
    });

    console.log('[WEBHOOK] Marked shop as uninstalled:', normalizedDomain);
  }
}
