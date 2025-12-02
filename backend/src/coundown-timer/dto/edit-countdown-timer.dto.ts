import { PartialType } from '@nestjs/swagger';
import { CreateCountdownTimerDto } from './create-countdown-timer.dto';

// edit dto extends create dto to make all fields optional
export class EditCountdownTimerDto extends PartialType(
  CreateCountdownTimerDto,
) {}
