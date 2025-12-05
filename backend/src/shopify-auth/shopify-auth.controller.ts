import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';
import { createHmac } from 'node:crypto';
import { ShopifyAuthService } from './shopify-auth.service';

@Controller('auth')
export class ShopifyAuthController {
  constructor(private readonly shopifyAuthService: ShopifyAuthService) {}

  private normalizeShopDomain(shop: string): string {
    return shop.endsWith('.myshopify.com') ? shop : `${shop}.myshopify.com`;
  }

  private redirectToShopifyAuth(shop: string, res: Response) {
    const shopifyDomain = this.normalizeShopDomain(shop);

    const redirectUrl = `${process.env.SHOPIFY_HOST}/api/v1/auth/callback`;
    const scopes = process.env.SHOPIFY_SCOPES;

    const installUrl =
      `https://${shopifyDomain}/admin/oauth/authorize?` +
      `client_id=${process.env.SHOPIFY_API_KEY}` +
      `&scope=${scopes}` +
      `&redirect_uri=${encodeURIComponent(redirectUrl)}`;

    console.log('[AUTH] Redirecting to install URL:', installUrl);
    return res.redirect(installUrl);
  }

  @Get()
  async install(@Query('shop') shop: string, @Res() res: Response) {
    if (!shop) throw new BadRequestException('Missing shop parameter');

    const shopifyDomain = this.normalizeShopDomain(shop);
    console.log('[AUTH] /auth install, shop =', shopifyDomain);

    const existing =
      await this.shopifyAuthService.getShopByDomain(shopifyDomain);

    // Nếu shop chưa tồn tại trong DB, redirect đến Shopify OAuth: choox này sẽ vào callbcak và tạo mới đưuọc script_tag
    if (!existing) {
      console.log('[AUTH] No existing shop, redirecting to Shopify OAuth');
      return this.redirectToShopifyAuth(shopifyDomain, res);
    }

    // Shop đã tồn tại, đảm bảo có script_tag rồi redirect về frontend
    try {
      console.log('[AUTH] Existing shop, ensuring ScriptTag...');
      console.log('SHOP EXISTING ACCESS TOKEN', existing.accessToken);

      await this.shopifyAuthService.ensureScriptTag(
        shopifyDomain,
        existing.accessToken,
      );

      const frontendUrl = `${process.env.FRONTEND_URL}?shop=${encodeURIComponent(
        shopifyDomain,
      )}`;
      console.log('[AUTH] Redirecting to frontend URL:', frontendUrl);
      return res.redirect(frontendUrl);
    } catch (err: any) {
      // token expired
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log(
          '[AUTH] access token invalid, redirecting to Shopify OAuth again',
        );
        return this.redirectToShopifyAuth(shopifyDomain, res);
      }

      console.error('[AUTH] ensureScriptTag error:', err?.message || err);
      throw err;
    }
  }

  @Get('callback')
  async callback(@Query() query: any, @Res() res: Response) {
    console.log('=== Shopify callback start ===');
    console.log('[AUTH] Raw query:', query);

    const { shop, hmac, code } = query;
    if (!shop || !hmac || !code) {
      console.error('[AUTH] Missing params in callback');
      throw new BadRequestException('Missing parameters');
    }

    if (!this.verifyHmac(query)) {
      console.error('[AUTH] Invalid HMAC in callback');
      throw new BadRequestException('Invalid HMAC');
    }

    const shopifyDomain = this.normalizeShopDomain(shop);
    const tokenUrl = `https://${shopifyDomain}/admin/oauth/access_token`;

    try {
      console.log('[AUTH] Requesting access token from:', tokenUrl);

      const response = await axios.post(tokenUrl, {
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      });

      console.log('[AUTH] Token response status:', response.status);
      console.log('[AUTH] Token response data:', response.data);

      const accessToken = response.data.access_token as string;

      console.log('[AUTH] Upserting shop in DB...');
      await this.shopifyAuthService.upsertShop(shopifyDomain, accessToken);
      console.log('[AUTH] Upsert done');
      console.log('[AUTH] Ensuring script tag...');
      await this.shopifyAuthService.ensureScriptTag(shopifyDomain, accessToken);

      console.log('[AUTH] Ensuring app/uninstalled webhook...');
      await this.shopifyAuthService.ensureAppUninstalledWebhook(
        shopifyDomain,
        accessToken,
      );

      const frontendUrl = `${process.env.FRONTEND_URL}?shop=${encodeURIComponent(
        shopifyDomain,
      )}`;

      console.log('[AUTH] Redirecting to frontend URL:', frontendUrl);
      return res.redirect(frontendUrl);
    } catch (err: any) {
      console.error('=== ERROR in callback ===');
      if (err.response) {
        console.error('Status:', err.response.status);
        console.error('Data  :', err.response.data);
      } else {
        console.error('Message:', err.message);
        console.error(err);
      }

      return res
        .status(500)
        .send('OAuth callback error. Check backend logs for details.');
    }
  }

  private verifyHmac(query: any): boolean {
    const { hmac, ...params } = query;

    const message = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const generated = createHmac('sha256', process.env.SHOPIFY_API_SECRET ?? '')
      .update(message)
      .digest('hex');

    const valid = generated === hmac;
    if (!valid) {
      console.error('[AUTH] HMAC mismatch', {
        expected: hmac,
        generated,
        message,
      });
    }
    return valid;
  }
}
