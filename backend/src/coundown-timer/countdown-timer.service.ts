import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CountdownTimer, Shop } from 'generated/prisma/client';
import { TimerStatus, TimmerType } from 'generated/prisma/enums';
import { ModelName } from 'generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateService, EditService, FindService } from 'src/shared/services';
import { DeleteService } from 'src/shared/services/delete.service';
import { CreateCountdownTimerDto, EditCountdownTimerDto } from './dto';

const MAX_TIMERS_PER_SHOP = 20;
const DEFAULT_ORDER_BY = [
  { status: 'asc' },
  { position: 'asc' },
  { updatedAt: 'desc' },
];
const DEFAULT_ORDER_STRING = 'status:asc,position:asc,updatedAt:desc';
const ORDERABLE_FIELDS = [
  'status',
  'position',
  'createdAt',
  'updatedAt',
  'name',
];

@Injectable()
export class CountdownTimerService {
  constructor(
    private readonly createService: CreateService,
    private readonly editService: EditService,
    private readonly findService: FindService,
    private readonly deleteService: DeleteService,
    private readonly prismaService: PrismaService,
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

  private validateCountdownTypeRules(
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

  private async ensureTimerCapacity(shopId: number) {
    const totalTimers = await this.findService.countBy({
      model: ModelName.CountdownTimer,
      where: { shopId },
    });

    if (totalTimers >= MAX_TIMERS_PER_SHOP) {
      throw new BadRequestException({
        code: 'MAX_TIMERS_REACHED',
        message: `You have reached the maximum of ${MAX_TIMERS_PER_SHOP} timers for this store.`,
      });
    }
  }

  private async ensurePositionAvailable(
    shopId: number,
    position: string,
    excludeTimerId?: number,
  ) {
    const where: Record<string, unknown> = {
      shopId,
      position,
      status: TimerStatus.ACTIVE,
    };

    if (excludeTimerId) {
      where.id = { not: excludeTimerId };
    }

    const conflict = await this.findService.findFirstBy<CountdownTimer>({
      model: ModelName.CountdownTimer,
      where,
    });

    if (conflict) {
      throw new ConflictException({
        code: 'POSITION_ALREADY_ACTIVE',
        message: 'There is already an active timer on this position.',
        position,
        conflictingTimer: {
          id: conflict.id,
          name: conflict.name,
          status: conflict.status,
          position: conflict.position,
        },
      });
    }
  }

  private parseOrderBy(orderByRaw?: string) {
    if (!orderByRaw) {
      return DEFAULT_ORDER_BY;
    }

    const segments = orderByRaw
      .split(',')
      .map((segment) => segment.trim())
      .filter(Boolean);

    const parsed: Record<string, 'asc' | 'desc'>[] = [];

    for (const segment of segments) {
      const [fieldRaw, directionRaw] = segment.split(':');
      const field = (fieldRaw || '').trim();
      if (!field || !ORDERABLE_FIELDS.includes(field)) {
        continue;
      }
      let direction = (directionRaw || '').trim().toLowerCase();
      direction = direction === 'asc' ? 'asc' : 'desc';
      parsed.push({ [field]: direction } as Record<string, 'asc' | 'desc'>);
    }

    return parsed.length ? parsed : DEFAULT_ORDER_BY;
  }

  private normalizeName(name?: string) {
    if (typeof name !== 'string') {
      return undefined;
    }

    return name.trim();
  }

  private async ensureUniqueName(
    shopId: number,
    name: string,
    excludeTimerId?: number,
  ) {
    const normalizedName = this.normalizeName(name) ?? name;
    const where: Record<string, unknown> = {
      shopId,
      name: normalizedName,
    };

    if (excludeTimerId) {
      where.id = { not: excludeTimerId };
    }

    const existing = await this.findService.findFirstBy<CountdownTimer>({
      model: ModelName.CountdownTimer,
      where,
    });

    if (existing) {
      throw new BadRequestException({
        code: 'NAME_ALREADY_USED',
        message: 'You already have another countdown using this name.',
        conflictingTimer: {
          id: existing.id,
          name: existing.name,
          status: existing.status,
          position: existing.position,
        },
      });
    }
  }

  async createTimer(shopDomain: string, dto: CreateCountdownTimerDto) {
    /**
      create countdown timer for the shop
      1. validate shop exists
      2. validate business rules
      3. create timer
    */

    const normalizedName = this.normalizeName(dto.name);
    if (!normalizedName) {
      throw new BadRequestException('Name cannot be blank.');
    }
    const normalizedDto: CreateCountdownTimerDto = {
      ...dto,
      name: normalizedName,
    };

    const shop: Shop = await this.getShopOrThrow(shopDomain);
    await this.ensureTimerCapacity(shop.id);
    await this.ensureUniqueName(shop.id, normalizedDto.name);
    this.validateCountdownTypeRules(normalizedDto);

    const desiredStatus = normalizedDto.status ?? TimerStatus.INACTIVE;
    if (desiredStatus === TimerStatus.ACTIVE) {
      await this.ensurePositionAvailable(shop.id, normalizedDto.position);
    }

    return await this.createService.create<CountdownTimer>({
      model: ModelName.CountdownTimer,
      data: {
        ...normalizedDto,
        shopId: shop.id,
        status: desiredStatus,
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

  // pagination
  async findTimersByShopPaginated(
    shopDomain: string,
    page = 1,
    size = 10,
    orderByRaw = DEFAULT_ORDER_STRING,
  ) {
    const shop: Shop = await this.getShopOrThrow(shopDomain);

    const currentPage = Number.isNaN(Number(page))
      ? 1
      : Math.max(1, Number(page));
    let pageSize = Number.isNaN(Number(size)) ? 10 : Number(size);
    pageSize = Math.min(Math.max(pageSize, 5), 50);

    const orderBy = this.parseOrderBy(orderByRaw);
    const where = { shopId: shop.id };
    const [items, total] = await Promise.all([
      this.findService.findManyBy<CountdownTimer>({
        model: ModelName.CountdownTimer,
        where,
        optionals: {
          orderBy,
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
        },
      }),
      this.findService.countBy({
        model: ModelName.CountdownTimer,
        where,
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      items,
      page: currentPage,
      size: pageSize,
      totalItems: total,
      totalPages,
      orderBy: orderByRaw || DEFAULT_ORDER_STRING,
    };
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
    const shop = await this.getShopOrThrow(shopDomain);
    const timer: CountdownTimer = await this.findOneTimerByShop(
      shopDomain,
      timerId,
    );

    let normalizedDto: EditCountdownTimerDto = dto;
    if (dto.name !== undefined) {
      const normalizedName = this.normalizeName(dto.name);
      if (!normalizedName) {
        throw new BadRequestException('Name cannot be blank.');
      }
      normalizedDto = { ...dto, name: normalizedName };
    }

    this.validateCountdownTypeRules(normalizedDto);
    // dto: new data to update
    // timer: existing timer data

    const nextStatus = normalizedDto.status ?? timer.status;
    const nextPosition = normalizedDto.position ?? timer.position;
    if (normalizedDto.name && normalizedDto.name !== timer.name) {
      await this.ensureUniqueName(shop.id, normalizedDto.name, timer.id);
    }

    if (nextStatus === TimerStatus.ACTIVE) {
      await this.ensurePositionAvailable(shop.id, nextPosition, timer.id);
    }

    return await this.editService.update<CountdownTimer>({
      model: ModelName.CountdownTimer,
      where: { id: timer.id },
      update: {
        name: normalizedDto.name ?? timer.name,
        message: normalizedDto.message ?? timer.message,
        type: normalizedDto.type ?? timer.type,
        startAt:
          normalizedDto.startAt !== undefined
            ? normalizedDto.startAt
              ? new Date(normalizedDto.startAt)
              : null
            : timer.startAt,
        endAt:
          normalizedDto.endAt !== undefined
            ? normalizedDto.endAt
              ? new Date(normalizedDto.endAt)
              : null
            : timer.endAt,
        evergreenMinutes:
          normalizedDto.evergreenMinutes !== undefined
            ? normalizedDto.evergreenMinutes
            : timer.evergreenMinutes,
        position: normalizedDto.position ?? timer.position,
        bgColor: normalizedDto.bgColor ?? timer.bgColor,
        textColor: normalizedDto.textColor ?? timer.textColor,
        status: normalizedDto.status ?? timer.status,
      },
    });
  }

  async toggleStatusTimer(shopDomain: string, timerId: number) {
    const shop = await this.getShopOrThrow(shopDomain);
    const timer: CountdownTimer = await this.findOneTimerByShop(
      shopDomain,
      timerId,
    );

    const newStatus =
      timer.status === TimerStatus.ACTIVE
        ? TimerStatus.INACTIVE
        : TimerStatus.ACTIVE;

    if (newStatus === TimerStatus.ACTIVE) {
      await this.ensurePositionAvailable(shop.id, timer.position, timer.id);
    }

    return await this.editService.update<CountdownTimer>({
      model: ModelName.CountdownTimer,
      where: { id: timer.id },
      update: {
        status: newStatus,
      },
    });
  }

  async forceActivateTimer(shopDomain: string, timerId: number) {
    const shop = await this.getShopOrThrow(shopDomain);
    const timer = await this.findOneTimerByShop(shopDomain, timerId);

    const [, updatedTimer] = await this.prismaService.$transaction([
      this.prismaService.countdownTimer.updateMany({
        where: {
          shopId: shop.id,
          position: timer.position,
          status: TimerStatus.ACTIVE,
          NOT: { id: timer.id },
        },
        data: { status: TimerStatus.INACTIVE },
      }),
      this.prismaService.countdownTimer.update({
        where: { id: timer.id },
        data: { status: TimerStatus.ACTIVE },
      }),
    ]);

    return updatedTimer;
  }

  async deleteTimer(shopDomain: string, timerId: number) {
    // chek shop exists
    await this.getShopOrThrow(shopDomain);
    //  check timer exists and belongs to shop
    const timer: CountdownTimer = await this.findOneTimerByShop(
      shopDomain,
      timerId,
    );

    // delete timer
    await this.deleteService.delete<CountdownTimer>({
      model: ModelName.CountdownTimer,
      where: { id: timer.id },
    });

    return {
      success: true,
      deletedId: timer.id,
    };
  }

  async getTotalTimers(shopDomain: string) {
    const shop: Shop = await this.getShopOrThrow(shopDomain);
    // 3 totals: number of ACTIVE, INACTIVE, TOTAL timers
    const [activeCount, inactiveCount, totalCount] = await Promise.all([
      this.findService.countBy({
        model: ModelName.CountdownTimer,
        where: { shopId: shop.id, status: TimerStatus.ACTIVE },
      }),
      this.findService.countBy({
        model: ModelName.CountdownTimer,
        where: { shopId: shop.id, status: TimerStatus.INACTIVE },
      }),
      this.findService.countBy({
        model: ModelName.CountdownTimer,
        where: { shopId: shop.id },
      }),
    ]);

    return {
      active: activeCount,
      inactive: inactiveCount,
      total: totalCount,
    };
  }
}
