import { Controller, Get, Query } from '@nestjs/common';
import { StorefrontTimerService } from './storefront-timer.service';

export type Context = 'product' | 'cart' | 'default';

@Controller('storefront-timer')
export class StorefrontTimerController {
  constructor(private readonly storefrontService: StorefrontTimerService) {}

  @Get('')
  async getTime(
    @Query('shop') shopDomain: string,
    @Query('context') context: Context = 'default',
  ) {
    return await this.storefrontService.getStorefrontTimer(shopDomain, context);
  }
}
