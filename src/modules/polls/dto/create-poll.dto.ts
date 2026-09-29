import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { VotingAudience } from '@generated/prisma/enums';

export class CreatePollOptionDto {
  @ApiProperty({ example: 'Светло-серый', maxLength: 255 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Вариант должен быть строкой' })
  @IsNotEmpty({ message: 'Заполните вариант ответа' })
  @MaxLength(255, { message: 'Вариант слишком длинный' })
  title!: string;
}

export class CreatePollDto {
  @ApiProperty({ example: 'Какой цвет покрасить стены в подъездах?' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Вопрос должен быть строкой' })
  @IsNotEmpty({ message: 'Укажите вопрос' })
  @MaxLength(2000, { message: 'Вопрос слишком длинный' })
  question!: string;

  @ApiProperty({ type: [CreatePollOptionDto], minItems: 2, maxItems: 20 })
  @IsArray({ message: 'Варианты должны быть массивом' })
  @ArrayMinSize(2, { message: 'Добавьте хотя бы два варианта' })
  @ArrayMaxSize(20, { message: 'Можно добавить не больше 20 вариантов' })
  @IsObject({ each: true, message: 'Неверный вариант ответа' })
  @ValidateNested({ each: true })
  @Type(() => CreatePollOptionDto)
  options!: CreatePollOptionDto[];

  @ApiProperty({ type: Boolean, example: false })
  @IsBoolean({ message: 'Укажите можно ли выбрать несколько вариантов' })
  allowMultiple!: boolean;

  @ApiProperty({
    enum: VotingAudience,
    enumName: 'VotingAudience',
    description: 'all_residents: все жители, owners: только собственники',
  })
  @IsEnum(VotingAudience, { message: 'Выберите кто отвечает на опрос' })
  audience!: VotingAudience;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-10-07T20:59:00.000Z',
    description: 'Срок окончания с часовым поясом',
  })
  @IsDateString(
    { strict: true, strictSeparator: true },
    { message: 'Укажите срок в формате ISO' },
  )
  @Matches(/(?:Z|[+-]\d{2}:\d{2})$/, {
    message: 'Укажите часовой пояс срока',
  })
  endsAt!: string;
}
