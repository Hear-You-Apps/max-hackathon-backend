import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MeetingFormat } from '@generated/prisma/enums';

export class CreateMeetingQuestionDto {
  @ApiProperty({ example: 'Установить шлагбаум во дворе?', maxLength: 2000 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Вопрос должен быть строкой' })
  @IsNotEmpty({ message: 'Заполните вопрос' })
  @MaxLength(2000, { message: 'Вопрос должен быть не длиннее 2000 символов' })
  title!: string;
}

export class CreateMeetingDto {
  @ApiProperty({ example: 'Установка шлагбаума во дворе', maxLength: 255 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Название должно быть строкой' })
  @IsNotEmpty({ message: 'Укажите название собрания' })
  @MaxLength(255, { message: 'Название должно быть не длиннее 255 символов' })
  title!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Обсудим въезд во двор и стоимость установки',
    maxLength: 10000,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Описание должно быть строкой' })
  @MaxLength(10000, {
    message: 'Описание должно быть не длиннее 10000 символов',
  })
  description?: string | null;

  @ApiProperty({
    enum: MeetingFormat,
    enumName: 'MeetingFormat',
    description: 'in_person: очная, absentee: заочная, mixed: очно-заочная',
  })
  @IsEnum(MeetingFormat, { message: 'Выберите in_person, absentee или mixed' })
  format!: MeetingFormat;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 500,
    example: 'У второго подъезда',
    description: 'Место обязательно для очного и очно-заочного собрания',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Место проведения должно быть строкой' })
  @MaxLength(500, {
    message: 'Место проведения должно быть не длиннее 500 символов',
  })
  location?: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-10-01T16:00:00.000Z',
    description: 'Начало собрания с часовым поясом, дата должна быть в будущем',
  })
  @IsDateString(
    { strict: true, strictSeparator: true },
    {
      message: 'Укажите дату начала в формате ISO',
    },
  )
  @Matches(/(?:Z|[+-]\d{2}:\d{2})$/, {
    message: 'Укажите часовой пояс даты начала',
  })
  startsAt!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-10-07T20:59:00.000Z',
    description: 'Окончание собрания с часовым поясом, позже начала',
  })
  @IsDateString(
    { strict: true, strictSeparator: true },
    {
      message: 'Укажите дату окончания в формате ISO',
    },
  )
  @Matches(/(?:Z|[+-]\d{2}:\d{2})$/, {
    message: 'Укажите часовой пояс даты окончания',
  })
  endsAt!: string;

  @ApiProperty({
    type: [CreateMeetingQuestionDto],
    minItems: 1,
    maxItems: 100,
    description: 'Вопросы в порядке повестки',
  })
  @IsArray({ message: 'Повестка должна быть массивом вопросов' })
  @ArrayMinSize(1, { message: 'Добавьте хотя бы один вопрос' })
  @ArrayMaxSize(100, {
    message: 'В собрании может быть не больше 100 вопросов',
  })
  @IsObject({ each: true, message: 'Каждый вопрос должен быть объектом' })
  @ValidateNested({ each: true })
  @Type(() => CreateMeetingQuestionDto)
  questions!: CreateMeetingQuestionDto[];
}
