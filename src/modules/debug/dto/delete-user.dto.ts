import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';
import { MYSQL_UNSIGNED_INT_MAX } from '@common/constants/database.constants';

export class DeleteUserDto {
  @ApiProperty({
    description: 'ID пользователя в нашей БД',
    type: 'integer',
    example: 1,
    minimum: 1,
    maximum: MYSQL_UNSIGNED_INT_MAX,
  })
  @IsInt({ message: 'ID пользователя должен быть целым числом' })
  @Min(1, { message: 'ID пользователя должен быть положительным' })
  @Max(MYSQL_UNSIGNED_INT_MAX, {
    message: 'ID пользователя выходит за допустимый диапазон',
  })
  userId!: number;
}
