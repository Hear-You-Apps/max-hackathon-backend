import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';
import { MYSQL_UNSIGNED_INT_MAX } from '@common/constants/database.constants';

export class LeaveHouseMembershipDto {
  @ApiProperty({
    type: 'integer',
    example: 1,
    minimum: 1,
    maximum: MYSQL_UNSIGNED_INT_MAX,
  })
  @IsInt({ message: 'ID дома должен быть целым числом' })
  @Min(1, { message: 'ID дома должен быть положительным' })
  @Max(MYSQL_UNSIGNED_INT_MAX, {
    message: 'ID дома выходит за допустимый диапазон',
  })
  houseId!: number;
}
