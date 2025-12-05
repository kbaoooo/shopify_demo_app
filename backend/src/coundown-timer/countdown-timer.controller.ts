import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
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
    @Query('page') page = '1',
    @Query('size') size = '10',
    @Query('orderBy') orderBy?: string,
  ) {
    const shopDomain = this.resolveShopDomain(shopDomainHeader, shopQuery);

    const pageNum = Number(page);
    const sizeNum = Number(size);
    const orderByRaw = orderBy;

    return await this.countdownTimerService.findTimersByShopPaginated(
      shopDomain,
      pageNum,
      sizeNum,
      orderByRaw,
    );
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

  @Get('total')
  async getTotalTimers(
    @Headers('x-shop-domain') shopDomainHeader?: string,
    @Query('shop') shopQuery?: string,
  ) {
    const shopDomain = this.resolveShopDomain(shopDomainHeader, shopQuery);
    return await this.countdownTimerService.getTotalTimers(shopDomain);
  }

  @Post(':id/force-activate')
  async forceActivate(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-shop-domain') shopDomainHeader?: string,
    @Query('shop') shopQuery?: string,
  ) {
    const shopDomain = this.resolveShopDomain(shopDomainHeader, shopQuery);
    return await this.countdownTimerService.forceActivateTimer(shopDomain, id);
  }

  @Get(':id')
  async getTimerById(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-shop-domain') shopDomainHeader?: string,
    @Query('shop') shopQuery?: string,
  ) {
    const shopDomain = this.resolveShopDomain(shopDomainHeader, shopQuery);
    return await this.countdownTimerService.findOneTimerByShop(shopDomain, id);
  }

  @Put(':id')
  async editTimer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditCountdownTimerDto,
    @Headers('x-shop-domain') shopDomainHeader?: string,
    @Query('shop') shopQuery?: string,
  ) {
    const shopDomain = this.resolveShopDomain(shopDomainHeader, shopQuery);
    return await this.countdownTimerService.editTimer(shopDomain, id, dto);
  }

  @Patch(':id')
  async toggleStatusTimer(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-shop-domain') shopDomainHeader?: string,
    @Query('shop') shopQuery?: string,
  ) {
    const shopDomain = this.resolveShopDomain(shopDomainHeader, shopQuery);
    return await this.countdownTimerService.toggleStatusTimer(shopDomain, id);
  }

  @Delete(':id')
  async deleteTimer(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-shop-domain') shopDomainHeader?: string,
    @Query('shop') shopQuery?: string,
  ) {
    const shopDomain = this.resolveShopDomain(shopDomainHeader, shopQuery);
    return await this.countdownTimerService.deleteTimer(shopDomain, id);
  }
}

/**
 *  Admin URL: https://shopify.demoapp.website/api/v1/countdown-timer
 *  Storefront URL: https://shopify.demoapp.website/api/v1/countdown-timer/storefront?shop=shop-domain.myshopify.com&position=top-left
 *
 */
