import { Module } from '@nestjs/common';
import { StorefrontTimerController } from './storefront-timer.controller';
import { StorefrontTimerService } from './storefront-timer.service';

@Module({
  controllers: [StorefrontTimerController],
  providers: [StorefrontTimerService]
})
export class StorefrontTimerModule {}
