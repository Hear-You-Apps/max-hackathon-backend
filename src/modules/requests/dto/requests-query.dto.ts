import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { RequestCategory } from '@generated/prisma/enums';
import {
  RequestsScope,
  RequestsStatusFilter,
} from '../enums/requests-query.enum';

export class RequestsQueryDto {
  @ApiPropertyOptional({
    enum: RequestsScope,
    enumName: 'RequestsScope',
    default: RequestsScope.MINE,
    description: 'mine: свои заявки, house: открытые соседям',
  })
  @IsEnum(RequestsScope, { message: 'Укажите mine или house' })
  scope: RequestsScope = RequestsScope.MINE;

  @ApiPropertyOptional({
    enum: RequestsStatusFilter,
    enumName: 'RequestsStatusFilter',
    default: RequestsStatusFilter.all,
    description:
      'all: все статусы, open: кроме закрытых и отменённых, completed: ждут подтверждения или закрыты, либо конкретный статус',
  })
  @IsEnum(RequestsStatusFilter, { message: 'Неверный фильтр статуса' })
  status: RequestsStatusFilter = RequestsStatusFilter.all;

  @ApiPropertyOptional({ enum: RequestCategory, enumName: 'RequestCategory' })
  @IsOptional()
  @IsEnum(RequestCategory, { message: 'Неверная категория заявки' })
  category?: RequestCategory;

  @ApiPropertyOptional({
    type: 'integer',
    default: 1,
    minimum: 1,
    maximum: 1000000,
  })
  @Type(() => Number)
  @IsInt({ message: 'Номер страницы должен быть целым числом' })
  @Min(1, { message: 'Номер страницы должен быть не меньше 1' })
  @Max(1000000, { message: 'Номер страницы должен быть не больше 1000000' })
  page = 1;

  @ApiPropertyOptional({
    type: 'integer',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt({ message: 'Размер страницы должен быть целым числом' })
  @Min(1, { message: 'Размер страницы должен быть не меньше 1' })
  @Max(100, { message: 'Размер страницы должен быть не больше 100' })
  limit = 20;
}
