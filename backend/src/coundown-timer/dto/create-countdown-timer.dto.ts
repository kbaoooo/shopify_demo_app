import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TimerPosition, TimerStatus, TimmerType } from 'generated/prisma/enums';

export class CreateCountdownTimerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  message: string;

  @IsEnum(TimmerType)
  type: TimmerType;

  @IsOptional()
  @IsString()
  startAt?: string;

  @IsOptional()
  @IsString()
  endAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  evergreenMinutes?: number;

  @IsEnum(TimerPosition)
  position: TimerPosition;

  @IsString()
  bgColor: string;

  @IsString()
  textColor: string;

  @IsEnum(TimerStatus)
  status: TimerStatus;
}
