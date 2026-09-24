import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { MYSQL_UNSIGNED_INT_MAX } from '@common/constants/database.constants';

export class FileIdParamsDto {
  @ApiProperty({
    type: 'integer',
    minimum: 1,
    maximum: MYSQL_UNSIGNED_INT_MAX,
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'ID файла должен быть целым числом' })
  @Min(1, { message: 'ID файла должен быть положительным' })
  @Max(MYSQL_UNSIGNED_INT_MAX, {
    message: 'ID файла выходит за допустимый диапазон',
  })
  fileId!: number;
}
