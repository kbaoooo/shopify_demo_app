import { Module } from '@nestjs/common';
import { CreateService, EditService, FindService } from 'src/shared/services';
import { CountdownTimerController } from './countdown-timer.controller';
import { CountdownTimerService } from './countdown-timer.service';

@Module({
  controllers: [CountdownTimerController],
  providers: [CountdownTimerService, CreateService, EditService, FindService],
})
export class CountdownTimerModule {}
