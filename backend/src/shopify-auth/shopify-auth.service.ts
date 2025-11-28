import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ShopifyAuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async upsertShop(shopDomain: string, accessToken: string) {
    return this.prismaService.shop.upsert({
      where: { shopDomain },
      update: { accessToken },
      create: { shopDomain, accessToken },
    });
  }

  async getShopByDomain(shopDomain: string) {
    return this.prismaService.shop.findUnique({
      where: { shopDomain },
    });
  }
}
