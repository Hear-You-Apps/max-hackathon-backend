import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApartmentRelationship } from '@generated/prisma/enums';
import { SearchHouseQueryDto } from './search-house-query.dto';

export class JoinHouseDto extends PickType(SearchHouseQueryDto, [
  'code',
] as const) {
  @ApiProperty({ example: '112', maxLength: 32 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString({ message: 'Номер квартиры должен быть строкой' })
  @IsNotEmpty({ message: 'Укажите номер квартиры' })
  @MaxLength(32, { message: 'Номер квартиры не должен превышать 32 символа' })
  apartmentNumber!: string;

  @ApiProperty({ example: 'Александр Кузнецов', maxLength: 255 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Укажите имя' })
  @MaxLength(255, { message: 'Имя не должно превышать 255 символов' })
  displayName!: string;

  @ApiProperty({
    enum: ApartmentRelationship,
    enumName: 'ApartmentRelationship',
  })
  @IsEnum(ApartmentRelationship, { message: 'Укажите owner или tenant' })
  relationship!: ApartmentRelationship;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Если передано, обновляет уведомления во всех домах',
  })
  @IsOptional()
  @IsBoolean({ message: 'notificationsEnabled должен быть true или false' })
  notificationsEnabled?: boolean;
}
