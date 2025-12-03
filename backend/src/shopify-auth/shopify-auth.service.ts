import { Injectable } from '@nestjs/common';
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
      create: { shopDomain, accessToken },
      update: { accessToken },
    });
  }

  async getShopByDomain(shopDomain: string) {
    return await this.findService.findUniqueBy<Shop>({
      model: ModelName.Shop,
      where: { shopDomain },
    });
  }
}
