import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MYSQL_UNSIGNED_INT_MAX } from '@common/constants/database.constants';
import {
  RequestCategory,
  RequestLocationType,
  RequestVisibility,
} from '@generated/prisma/enums';

export class CreateRequestDto {
  @ApiProperty({ example: 'Течёт кровля над пятым подъездом', maxLength: 255 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Тема должна быть строкой' })
  @IsNotEmpty({ message: 'Укажите тему заявки' })
  @MaxLength(255, { message: 'Тема должна быть не длиннее 255 символов' })
  title!: string;

  @ApiProperty({
    example: 'После дождя вода течёт по стене у лифта',
    maxLength: 10000,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Описание должно быть строкой' })
  @IsNotEmpty({ message: 'Опишите проблему' })
  @MaxLength(10000, {
    message: 'Описание должно быть не длиннее 10000 символов',
  })
  description!: string;

  @ApiProperty({
    enum: RequestCategory,
    enumName: 'RequestCategory',
    description:
      'management: УК, electrician: электрик, plumber: сантехник, duty: дежурная служба',
  })
  @IsEnum(RequestCategory, {
    message: 'Выберите management, electrician, plumber или duty',
  })
  category!: RequestCategory;

  @ApiProperty({
    enum: RequestLocationType,
    enumName: 'RequestLocationType',
    description: 'apartment: квартира, entrance: подъезд, yard: двор',
  })
  @IsEnum(RequestLocationType, {
    message: 'Выберите apartment, entrance или yard',
  })
  locationType!: RequestLocationType;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: MYSQL_UNSIGNED_INT_MAX,
    nullable: true,
    description: 'Своя подтверждённая квартира, обязательно для apartment',
  })
  @IsOptional()
  @IsInt({ message: 'ID квартиры должен быть целым числом' })
  @Min(1, { message: 'ID квартиры должен быть положительным' })
  @Max(MYSQL_UNSIGNED_INT_MAX, {
    message: 'ID квартиры выходит за допустимый диапазон',
  })
  apartmentId?: number | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 500,
    example: 'Подъезд 5, девятый этаж, у лифта',
    description: 'Уточнение места, обязательно для подъезда и двора',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Место должно быть строкой' })
  @MaxLength(500, { message: 'Место должно быть не длиннее 500 символов' })
  locationText?: string | null;

  @ApiPropertyOptional({
    enum: RequestVisibility,
    enumName: 'RequestVisibility',
    default: RequestVisibility.private,
    description:
      'private: только по ссылке, house: в списке дома. По ссылке могут открыть подтверждённые жители',
  })
  @IsEnum(RequestVisibility, {
    message: 'Видимость должна быть private или house',
  })
  visibility: RequestVisibility = RequestVisibility.private;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'uuid' },
    default: [],
    maxItems: 5,
    uniqueItems: true,
    description: 'ID своих файлов, загруженных в этом доме',
  })
  @IsArray({ message: 'Вложения должны быть массивом ID' })
  @ArrayMaxSize(5, { message: 'Можно прикрепить не больше 5 файлов' })
  @ArrayUnique({ message: 'Файлы не должны повторяться' })
  @IsUUID('4', { each: true, message: 'Неверный ID файла' })
  attachmentIds: string[] = [];
}
