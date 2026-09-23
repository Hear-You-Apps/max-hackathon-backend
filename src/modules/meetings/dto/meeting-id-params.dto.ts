import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { MYSQL_UNSIGNED_INT_MAX } from '@common/constants/database.constants';

export class MeetingIdParamsDto {
  @ApiProperty({
    type: 'integer',
    example: 1,
    minimum: 1,
    maximum: MYSQL_UNSIGNED_INT_MAX,
  })
  @Type(() => Number)
  @IsInt({ message: 'ID собрания должен быть целым числом' })
  @Min(1, { message: 'ID собрания должен быть положительным' })
  @Max(MYSQL_UNSIGNED_INT_MAX, {
    message: 'ID собрания выходит за допустимый диапазон',
  })
  meetingId!: number;
}
