import { Module } from '@nestjs/common';
import {
  CreateService,
  DeleteService,
  EditService,
  FindService,
} from 'src/shared/services';
import { CountdownTimerController } from './countdown-timer.controller';
import { CountdownTimerService } from './countdown-timer.service';

@Module({
  controllers: [CountdownTimerController],
  providers: [
    CountdownTimerService,
    CreateService,
    EditService,
    FindService,
    DeleteService,
  ],
})
export class CountdownTimerModule {}
