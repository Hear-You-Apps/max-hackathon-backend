import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { RequestStatus } from '@generated/prisma/enums';

export class UpdateRequestStatusDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: 'abf319d9-b173-4aeb-b9bb-7ca6e15e6df8',
  })
  @IsUUID('4', { message: 'Неверный ID заявки' })
  requestId!: string;

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
