import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  Max,
  Min,
} from 'class-validator';
import { MYSQL_UNSIGNED_INT_MAX } from '@common/constants/database.constants';

export class UpdatePollVotesDto {
  @ApiProperty({
    type: [Number],
    minItems: 0,
    maxItems: 20,
    description:
      'ID выбранных вариантов. Повторная отправка меняет ответ, пустой массив сбрасывает выбор',
    example: [1, 3],
  })
  @IsArray({ message: 'Передайте выбранные варианты массивом' })
  @ArrayMaxSize(20, { message: 'Слишком много вариантов' })
  @ArrayUnique({ message: 'Варианты не должны повторяться' })
  @IsInt({ each: true, message: 'ID варианта должен быть целым числом' })
  @Min(1, { each: true, message: 'ID варианта должен быть положительным' })
  @Max(MYSQL_UNSIGNED_INT_MAX, {
    each: true,
    message: 'ID варианта выходит за допустимый диапазон',
  })
  optionIds!: number[];
}
