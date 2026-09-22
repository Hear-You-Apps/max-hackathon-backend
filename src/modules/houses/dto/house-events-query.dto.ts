import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { HouseEventsPeriod } from '../enums/house-events-period.enum';

export class HouseEventsQueryDto {
  @ApiPropertyOptional({
    type: 'integer',
    default: 1,
    minimum: 1,
    maximum: 1_000_000,
    description: 'Номер страницы',
  })
  @Type(() => Number)
  @IsInt({ message: 'Номер страницы должен быть целым числом' })
  @Min(1, { message: 'Номер страницы должен быть не меньше 1' })
  @Max(1_000_000, { message: 'Номер страницы должен быть не больше 1000000' })
  page = 1;

  @ApiPropertyOptional({
    type: 'integer',
    default: 20,
    minimum: 1,
    maximum: 100,
    description: 'Количество событий на странице',
  })
  @Type(() => Number)
  @IsInt({ message: 'Размер страницы должен быть целым числом' })
  @Min(1, { message: 'Размер страницы должен быть не меньше 1' })
  @Max(100, { message: 'Размер страницы должен быть не больше 100' })
  limit = 20;

  @ApiPropertyOptional({
    enum: HouseEventsPeriod,
    enumName: 'HouseEventsPeriod',
    default: HouseEventsPeriod.ALL,
    description:
      'all: все события; upcoming: текущие и будущие; past: завершённые',
  })
  @IsEnum(HouseEventsPeriod, {
    message: 'Период должен быть all, upcoming или past',
  })
  period: HouseEventsPeriod = HouseEventsPeriod.ALL;
}
