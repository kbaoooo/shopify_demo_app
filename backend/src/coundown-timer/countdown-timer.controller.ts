import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CountdownTimerService } from './countdown-timer.service';
import { CreateCountdownTimerDto, EditCountdownTimerDto } from './dto';

@Controller('countdown-timer')
export class CountdownTimerController {
  constructor(private readonly countdownTimerService: CountdownTimerService) {}

  private resolveShopDomain(header?: string, query?: string) {
    const value = header || query;
    if (!value) {
      throw new BadRequestException('Missing shop domain');
    }
    return value;
  }

  // admin dashbaord (vuejs app)
  @Get('')
  async getAllTimes(
    @Headers('x-shop-domain') shopDomainHeader?: string,
    @Query('shop') shopQuery?: string,
  ) {
    const shopDomain = this.resolveShopDomain(shopDomainHeader, shopQuery);
    return await this.countdownTimerService.finAllTimersByShop(shopDomain);
  }

  @Post('')
  async createTimer(
    @Body() dto: CreateCountdownTimerDto,
    @Headers('x-shop-domain') shopDomainHeader?: string,
    @Query('shop') shopQuery?: string,
  ) {
    const shopDomain = this.resolveShopDomain(shopDomainHeader, shopQuery);
    return await this.countdownTimerService.createTimer(shopDomain, dto);
  }

  @Get(':id')
  async getTimerById(
    @Param('id') id: string,
    @Headers('x-shop-domain') shopDomainHeader?: string,
    @Query('shop') shopQuery?: string,
  ) {
    const shopDomain = this.resolveShopDomain(shopDomainHeader, shopQuery);
    return await this.countdownTimerService.findOneTimerByShop(shopDomain, +id);
  }

  @Put(':id')
  async editTimer(
    @Param('id') id: string,
    @Body() dto: EditCountdownTimerDto,
    @Headers('x-shop-domain') shopDomainHeader?: string,
    @Query('shop') shopQuery?: string,
  ) {
    const shopDomain = this.resolveShopDomain(shopDomainHeader, shopQuery);
    return await this.countdownTimerService.editTimer(shopDomain, +id, dto);
  }

  @Patch(':id')
  async toggleStatusTimer(
    @Param('id') id: string,
    @Headers('x-shop-domain') shopDomainHeader?: string,
    @Query('shop') shopQuery?: string,
  ) {
    const shopDomain = this.resolveShopDomain(shopDomainHeader, shopQuery);
    return await this.countdownTimerService.toggleStatusTimer(shopDomain, +id);
  }

  // STOREFRONT endpoints (JS script called)
  @Get('storefront')
  async getForStorefront(
    @Query('shop') shopDomain: string,
    @Query('position') position?: string,
  ) {
    const timers =
      await this.countdownTimerService.getActiveTimersForStorefront(
        shopDomain,
        position,
      );

    return timers;
  }
}

/**
 *  Admin URL: https://shopify.demoapp.website/api/v1/countdown-timer
 *  Storefront URL: https://shopify.demoapp.website/api/v1/countdown-timer/storefront?shop=shop-domain.myshopify.com&position=top-left
 *
 */
