import { Module } from '@nestjs/common';
import { CoundownTimerController } from './coundown-timer.controller';
import { CoundownTimerService } from './coundown-timer.service';

@Module({
  controllers: [CoundownTimerController],
  providers: [CoundownTimerService]
})
export class CoundownTimerModule {}
