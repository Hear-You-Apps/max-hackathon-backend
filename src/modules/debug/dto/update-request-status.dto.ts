import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MYSQL_UNSIGNED_INT_MAX } from '@common/constants/database.constants';
import { RequestStatus } from '@generated/prisma/enums';

export class UpdateRequestStatusDto {
  @ApiProperty({
    type: 'integer',
    example: 148,
    minimum: 1,
    maximum: MYSQL_UNSIGNED_INT_MAX,
  })
  @IsInt({ message: 'ID заявки должен быть целым числом' })
  @Min(1, { message: 'ID заявки должен быть положительным' })
  @Max(MYSQL_UNSIGNED_INT_MAX, {
    message: 'ID заявки выходит за допустимый диапазон',
  })
  requestId!: number;

  @ApiProperty({ enum: RequestStatus, enumName: 'RequestStatus' })
  @IsEnum(RequestStatus, { message: 'Неверный статус заявки' })
  status!: RequestStatus;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Бригада выедет завтра',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Комментарий должен быть строкой' })
  @MaxLength(2000, {
    message: 'Комментарий не должен быть длиннее 2000 символов',
  })
  comment?: string | null;
}
