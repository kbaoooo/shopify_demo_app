import { Injectable } from '@nestjs/common';
import { CountdownTimer, Shop } from 'generated/prisma/client';
import { TimerPosition, TimerStatus, TimmerType } from 'generated/prisma/enums';
import { ModelName } from 'generated/prisma/internal/prismaNamespace';
import { FindService } from 'src/shared';
import { Context } from './storefront-timer.controller';

@Injectable()
export class StorefrontTimerService {
  constructor(private readonly findService: FindService) {}
  async getStorefrontTimer(shopDomain: string, context: Context) {
    /**
     * 1. Find shop by domain
     * 2. Get all ACTIVE & not expired timers for the shop
     * 3. Filter timers based on context & position
     * 4. Return the most recently updated timer
     * 5. If no timer found, return null
     * 6. If shop not found, return null
     * 7. If shopDomain is invalid, return null
     * 8. If no ACTIVE timers, return null
     * 9. If all timers are expired, return null
     * 10. If multiple timers match, return the most recently updated one
      11. If no timers match the context & position, return null
      12. If timer is of type FIXED, ensure current date is between startAt and endAt
      13. If timer is of type EVERGREEN, no date checks needed
     */

    if (!shopDomain) return null;

    // normalize domain
    const normalizedDomain = shopDomain.endsWith('.myshopify.com')
      ? shopDomain
      : `${shopDomain}.myshopify.com`;

    const shop: Shop | null = await this.findService.findUniqueBy({
      model: ModelName.Shop,
      where: { shopDomain: normalizedDomain },
    });

    if (!shop) return null;

    // get all timers ACTIVE & not expired
    const now = new Date();
    const whereClause = {
      shopId: shop.id,
      status: TimerStatus.ACTIVE,
      OR: [
        { type: TimmerType.EVERGREEN },
        {
          type: TimmerType.FIXED,
          //available fixed timers that are not expired
          endAt: { gte: now },
        },
      ],
    };
    const optionals = {
      orderBy: [
        {
          updatedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    };
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const allTimers = (await this.findService.findManyBy({
      model: ModelName.CountdownTimer,
      where: whereClause,
      ...optionals,
    })) as CountdownTimer[];

    console.log('ALL TIMER: ', allTimers);

    // filter timers that are currently valid
    const validTimers = allTimers.filter((timer: CountdownTimer) => {
      if (timer.type === TimmerType.FIXED) {
        if (!timer.endAt) return false;
        if (timer.startAt && timer.startAt > now) return false; // not started yet
      }

      return true;
    });

    if (!validTimers.length) return null;

    const pick = (position: string[]) =>
      validTimers.find((timer: CountdownTimer) =>
        position.includes(timer.position),
      );

    let candidateTimer: CountdownTimer | undefined = undefined;

    /**
     * Filter timers based on context & position
     * Priority order:
     * - For product page: PRODUCT_PAGE > TOP_BAR > BOTTOM_BAR
     * - For cart page: CART_PAGE > TOP_BAR > BOTTOM_BAR
     * - For other pages: TOP_BAR > BOTTOM_BAR
     */
    if (context === 'product') {
      candidateTimer =
        pick([TimerPosition.PRODUCT_PAGE]) ||
        pick([TimerPosition.TOP_BAR]) ||
        pick([TimerPosition.BOTTOM_BAR]);
    } else if (context === 'cart') {
      candidateTimer =
        pick([TimerPosition.CART_PAGE]) ||
        pick([TimerPosition.TOP_BAR]) ||
        pick([TimerPosition.BOTTOM_BAR]);
    } else {
      candidateTimer =
        pick([TimerPosition.TOP_BAR]) || pick([TimerPosition.BOTTOM_BAR]);
    }
    console.log('Candidate timer', candidateTimer);

    if (!candidateTimer) return null;

    return candidateTimer;
  }
}
