import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { MeetingFormat, VotingAudience } from '@generated/prisma/enums';

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
  @ApiPropertyOptional({
    example: 'Установка шлагбаума во дворе',
    maxLength: 255,
    description: 'Название собрания, если вопросов несколько',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Название должно быть строкой' })
  @IsNotEmpty({ message: 'Укажите название собрания' })
  @MaxLength(255, { message: 'Название должно быть не длиннее 255 символов' })
  title?: string;

  @ApiPropertyOptional({
    example: 'Установить шлагбаум во дворе?',
    maxLength: 2000,
    description: 'Один вопрос для простого собрания, вместо questions',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Вопрос должен быть строкой' })
  @IsNotEmpty({ message: 'Заполните вопрос' })
  @MaxLength(2000, { message: 'Вопрос должен быть не длиннее 2000 символов' })
  question?: string;

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

  @ApiPropertyOptional({
    enum: MeetingFormat,
    enumName: 'MeetingFormat',
    description: 'in_person: очная, absentee: заочная, mixed: очно-заочная',
    default: MeetingFormat.absentee,
  })
  @IsOptional()
  @IsEnum(MeetingFormat, { message: 'Выберите in_person, absentee или mixed' })
  format?: MeetingFormat;

  @ApiPropertyOptional({
    enum: VotingAudience,
    enumName: 'VotingAudience',
    default: VotingAudience.owners,
    description: 'all_residents: все жители, owners: только собственники',
  })
  @IsOptional()
  @IsEnum(VotingAudience, { message: 'Выберите кто отвечает на собрании' })
  audience?: VotingAudience;

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

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    example: '2026-10-01T16:00:00.000Z',
    description: 'Начало собрания, если нужно запланировать его на будущее',
  })
  @IsOptional()
  @IsDateString(
    { strict: true, strictSeparator: true },
    {
      message: 'Укажите дату начала в формате ISO',
    },
  )
  @Matches(/(?:Z|[+-]\d{2}:\d{2})$/, {
    message: 'Укажите часовой пояс даты начала',
  })
  startsAt?: string;

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

  @ApiPropertyOptional({
    type: [CreateMeetingQuestionDto],
    minItems: 1,
    maxItems: 100,
    description: 'Вопросы повестки, вместо одного question',
  })
  @IsOptional()
  @IsArray({ message: 'Повестка должна быть массивом вопросов' })
  @ArrayMinSize(1, { message: 'Добавьте хотя бы один вопрос' })
  @ArrayMaxSize(100, {
    message: 'В собрании может быть не больше 100 вопросов',
  })
  @IsObject({ each: true, message: 'Каждый вопрос должен быть объектом' })
  @ValidateNested({ each: true })
  @Type(() => CreateMeetingQuestionDto)
  questions?: CreateMeetingQuestionDto[];

  @ApiPropertyOptional({
    type: 'integer',
    nullable: true,
    minimum: 1,
    maximum: 100,
    example: 50,
    description: 'Порог участия от числа квартир, null если не нужен',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Порог участия должен быть целым процентом' })
  @Min(1, { message: 'Порог участия должен быть от 1 до 100%' })
  @Max(100, { message: 'Порог участия должен быть от 1 до 100%' })
  participationThresholdPercent?: number | null;
}
