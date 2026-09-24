import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { MYSQL_UNSIGNED_INT_MAX } from '@common/constants/database.constants';
import { MeetingVoteChoice } from '@generated/prisma/enums';

export class MeetingVoteDto {
  @ApiProperty({
    type: 'integer',
    example: 1,
    minimum: 1,
    maximum: MYSQL_UNSIGNED_INT_MAX,
    description: 'ID вопроса',
  })
  @IsInt({ message: 'ID вопроса должен быть целым числом' })
  @Min(1, { message: 'ID вопроса должен быть положительным' })
  @Max(MYSQL_UNSIGNED_INT_MAX, {
    message: 'ID вопроса выходит за допустимый диапазон',
  })
  questionId!: number;

  @ApiProperty({
    enum: MeetingVoteChoice,
    enumName: 'MeetingVoteChoice',
    example: MeetingVoteChoice.yes,
    description: 'yes: за, no: против, abstain: воздержался',
  })
  @IsEnum(MeetingVoteChoice, {
    message: 'Выберите yes, no или abstain',
  })
  choice!: MeetingVoteChoice;
}

export class UpdateMeetingVotesDto {
  @ApiProperty({
    type: [MeetingVoteDto],
    minItems: 1,
    maxItems: 100,
    description: 'Ответы на вопросы без повторяющихся questionId',
  })
  @IsArray({ message: 'Голоса должны быть массивом' })
  @ArrayMinSize(1, { message: 'Ответьте хотя бы на один вопрос' })
  @ArrayMaxSize(100, {
    message: 'За раз можно отправить не больше 100 ответов',
  })
  @ArrayUnique((vote: MeetingVoteDto | null) => vote?.questionId, {
    message: 'Вопросы не должны повторяться',
  })
  @IsObject({ each: true, message: 'Каждый ответ должен быть объектом' })
  @ValidateNested({ each: true })
  @Type(() => MeetingVoteDto)
  votes!: MeetingVoteDto[];
}

export class MeetingVotesResponseDto {
  @ApiProperty({
    type: [MeetingVoteDto],
    description: 'Все свои ответы по собранию в порядке повестки',
  })
  votes!: MeetingVoteDto[];
}
