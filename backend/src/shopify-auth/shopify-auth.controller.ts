import {
  BadRequestException,
  Controller,
  Get,
  Param,
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

  private redirectToShopifyAuth(shop: string, res: Response) {
    if (!shop) throw new BadRequestException('Missing shop parameter');

    const shopifyDomain = shop.endsWith('.myshopify.com')
      ? shop
      : `${shop}.myshopify.com`;

    const redirectUrl = `${process.env.SHOPIFY_HOST}/api/v1/auth/callback`;
    const scopes = process.env.SHOPIFY_SCOPES;

    const installUrl =
      `https://${shopifyDomain}/admin/oauth/authorize?` +
      `client_id=${process.env.SHOPIFY_API_KEY}` +
      `&scope=${scopes}` +
      `&redirect_uri=${encodeURIComponent(redirectUrl)}`;

    return res.redirect(installUrl);
  }

  @Get()
  install(@Query('shop') shop: string, @Res() res: Response) {
    return this.redirectToShopifyAuth(shop, res);
  }

  @Get(':host')
  installWithHost(
    @Param('host') _host: string, // bỏ qua
    @Query('shop') shop: string,
    @Res() res: Response,
  ) {
    return this.redirectToShopifyAuth(shop, res);
  }

  @Get('callback')
  async callback(@Query() query: any, @Res() res: Response) {
    const { shop, hmac, code } = query;
    if (!shop || !hmac || !code) {
      throw new BadRequestException('Missing parameters');
    }

    if (!this.verifyHmac(query)) {
      throw new BadRequestException('Invalid HMAC');
    }

    const shopifyDomain = shop.endsWith('.myshopify.com')
      ? shop
      : `${shop}.myshopify.com`;

    const tokenUrl = `https://${shopifyDomain}/admin/oauth/access_token`;

    const response = await axios.post(tokenUrl, {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    });

    const accessToken = response.data.access_token as string;

    await this.shopifyAuthService.upsertShop(shopifyDomain, accessToken);

    const frontendUrl = `${process.env.FRONTEND_HOST}?shop=${encodeURIComponent(
      shopifyDomain,
    )}`;
    return res.redirect(frontendUrl);
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

    return generated === hmac;
  }
}
