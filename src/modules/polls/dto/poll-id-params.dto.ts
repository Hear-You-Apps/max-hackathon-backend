import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { MYSQL_UNSIGNED_INT_MAX } from '@common/constants/database.constants';

export class PollIdParamsDto {
  @ApiProperty({
    type: 'integer',
    example: 1,
    minimum: 1,
    maximum: MYSQL_UNSIGNED_INT_MAX,
  })
  @Type(() => Number)
  @IsInt({ message: 'ID опроса должен быть целым числом' })
  @Min(1, { message: 'ID опроса должен быть положительным' })
  @Max(MYSQL_UNSIGNED_INT_MAX, {
    message: 'ID опроса выходит за допустимый диапазон',
  })
  pollId!: number;
}
