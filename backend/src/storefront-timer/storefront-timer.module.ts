import { Module } from '@nestjs/common';
import { FindService } from 'src/shared/services';
import { StorefrontTimerController } from './storefront-timer.controller';
import { StorefrontTimerService } from './storefront-timer.service';

@Module({
  controllers: [StorefrontTimerController],
  providers: [StorefrontTimerService, FindService],
})
export class StorefrontTimerModule {}
