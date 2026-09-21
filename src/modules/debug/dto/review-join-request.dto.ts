import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MYSQL_UNSIGNED_INT_MAX } from '@common/constants/database.constants';

export class ReviewJoinRequestDto {
  @ApiProperty({
    type: 'integer',
    example: 25,
    minimum: 1,
    maximum: MYSQL_UNSIGNED_INT_MAX,
  })
  @IsInt({ message: 'ID заявки должен быть целым числом' })
  @Min(1, { message: 'ID заявки должен быть положительным' })
  @Max(MYSQL_UNSIGNED_INT_MAX, {
    message: 'ID заявки выходит за допустимый диапазон',
  })
  requestId!: number;
}

export class RejectJoinRequestDto extends ReviewJoinRequestDto {
  @ApiProperty({ example: 'Неверно указан номер квартиры', maxLength: 2000 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Причина отклонения должна быть строкой' })
  @IsNotEmpty({ message: 'Укажите причину отклонения' })
  @MaxLength(2000, { message: 'Причина не должна превышать 2000 символов' })
  reason!: string;
}
