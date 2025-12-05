import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CountdownTimer, Shop } from 'generated/prisma/client';
import { TimerStatus, TimmerType } from 'generated/prisma/enums';
import { ModelName } from 'generated/prisma/internal/prismaNamespace';
import { CreateService, EditService, FindService } from 'src/shared/services';
import { CreateCountdownTimerDto, EditCountdownTimerDto } from './dto';

@Injectable()
export class CountdownTimerService {
  constructor(
    private readonly createService: CreateService,
    private readonly editService: EditService,
    private readonly findService: FindService,
  ) {}

  private async getShopOrThrow(shopDomain: string) {
    const shop = await this.findService.findUniqueBy<Shop>({
      model: ModelName.Shop,
      where: { shopDomain },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  private validateBusinessRules(
    dto: CreateCountdownTimerDto | EditCountdownTimerDto,
  ) {
    // validate timertype for fixed
    if (dto.type === TimmerType.FIXED) {
      if (!dto.endAt)
        throw new BadRequestException('endAt is required for FIXED timertype');
    }

    // validate timertype for evergreen
    if (dto.type === TimmerType.EVERGREEN) {
      if (!dto.evergreenMinutes || dto.evergreenMinutes <= 0) {
        throw new BadRequestException(
          'evergreenMinutes must be a positive number for EVERGREEN timertype',
        );
      }
    }
  }

  async createTimer(shopDomain: string, dto: CreateCountdownTimerDto) {
    /**
      create countdown timer for the shop
      1. validate shop exists
      2. validate business rules
      3. create timer
    */

    const shop: Shop = await this.getShopOrThrow(shopDomain);
    this.validateBusinessRules(dto);

    return await this.createService.create<CountdownTimer>({
      model: ModelName.CountdownTimer,
      data: {
        ...dto,
        shopId: shop.id,
      },
    });
  }

  async finAllTimersByShop(shopDomain: string) {
    const shop: Shop = await this.getShopOrThrow(shopDomain);

    return await this.findService.findManyBy<CountdownTimer>({
      model: ModelName.CountdownTimer,
      where: { shopId: shop.id },
      optionals: {
        orderBy: { createdAt: 'desc' },
      },
    });
  }

  async findOneTimerByShop(shopDomain: string, timerId: number) {
    // validate shop exists
    const shop: Shop = await this.getShopOrThrow(shopDomain);
    // validate timer exists
    const timer = await this.findService.findFirstBy<CountdownTimer>({
      model: ModelName.CountdownTimer,
      where: { id: timerId, shopId: shop.id },
    });

    if (!timer) {
      throw new NotFoundException('Countdown Timer not found');
    }

    return timer;
  }

  async editTimer(
    shopDomain: string,
    timerId: number,
    dto: EditCountdownTimerDto,
  ) {
    await this.getShopOrThrow(shopDomain);
    const timer: CountdownTimer = await this.findOneTimerByShop(
      shopDomain,
      timerId,
    );

    this.validateBusinessRules(dto);
    // dto: new data to update
    // timer: existing timer data

    return await this.editService.update<CountdownTimer>({
      model: ModelName.CountdownTimer,
      where: { id: timer.id },
      update: {
        name: dto.name ?? timer.name,
        message: dto.message ?? timer.message,
        type: dto.type ?? timer.type,
        startAt:
          dto.startAt !== undefined
            ? dto.startAt
              ? new Date(dto.startAt)
              : null
            : timer.startAt,
        endAt:
          dto.endAt !== undefined
            ? dto.endAt
              ? new Date(dto.endAt)
              : null
            : timer.endAt,
        evergreenMinutes:
          dto.evergreenMinutes !== undefined
            ? dto.evergreenMinutes
            : timer.evergreenMinutes,
        position: dto.position ?? timer.position,
        bgColor: dto.bgColor ?? timer.bgColor,
        textColor: dto.textColor ?? timer.textColor,
        status: dto.status ?? timer.status,
      },
    });
  }

  async toggleStatusTimer(shopDomain: string, timerId: number) {
    await this.getShopOrThrow(shopDomain);
    const timer: CountdownTimer = await this.findOneTimerByShop(
      shopDomain,
      timerId,
    );

    const newStatus =
      timer.status === TimerStatus.ACTIVE
        ? TimerStatus.INACTIVE
        : TimerStatus.ACTIVE;

    return await this.editService.update<CountdownTimer>({
      model: ModelName.CountdownTimer,
      where: { id: timer.id },
      update: {
        status: newStatus,
      },
    });
  }
}
