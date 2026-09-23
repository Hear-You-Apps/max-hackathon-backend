import { ApiProperty } from '@nestjs/swagger';
import { MeetingFormat, MeetingVoteChoice } from '@generated/prisma/enums';
import { MeetingStatus } from '../enums/meeting-status.enum';

export class MeetingVoteResultsDto {
  @ApiProperty({ type: 'integer', example: 42, description: 'Голоса за' })
  for!: number;

  @ApiProperty({ type: 'integer', example: 8, description: 'Голоса против' })
  against!: number;

  @ApiProperty({ type: 'integer', example: 3, description: 'Воздержались' })
  abstain!: number;
}

export class MeetingQuestionDto {
  @ApiProperty({ type: 'integer', example: 1 })
  id!: number;

  @ApiProperty({ example: 'Установить шлагбаум во дворе?' })
  title!: string;

  @ApiProperty({
    enum: MeetingVoteChoice,
    enumName: 'MeetingVoteChoice',
    nullable: true,
    description: 'Свой голос по вопросу, null если ещё не голосовали',
  })
  myVote!: MeetingVoteChoice | null;

  @ApiProperty({
    type: MeetingVoteResultsDto,
    description: 'Текущие результаты',
  })
  results!: MeetingVoteResultsDto;
}

export class MeetingDto {
  @ApiProperty({ type: 'integer', example: 1 })
  id!: number;

  @ApiProperty({ type: 'integer', example: 1, description: 'ID дома' })
  houseId!: number;

  @ApiProperty({ example: 'Установка шлагбаума во дворе' })
  title!: string;

  @ApiProperty({
    enum: MeetingFormat,
    enumName: 'MeetingFormat',
    description: 'in_person: очная, absentee: заочная, mixed: очно-заочная',
  })
  format!: MeetingFormat;

  @ApiProperty({
    enum: MeetingStatus,
    enumName: 'MeetingStatus',
    description:
      'scheduled: ещё не началось, active: идёт, closed: завершено, cancelled: отменено',
  })
  status!: MeetingStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'У второго подъезда',
  })
  location!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-10-01T16:00:00.000Z',
  })
  startsAt!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-10-07T20:59:00.000Z',
  })
  endsAt!: string;

  @ApiProperty({
    type: 'integer',
    example: 53,
    description:
      'Пользователи, ответившие хотя бы на один вопрос. Каждый считается один раз',
  })
  participantsCount!: number;
}

export class MeetingListItemDto extends MeetingDto {
  @ApiProperty({
    type: 'integer',
    example: 3,
    description: 'Количество вопросов',
  })
  questionsCount!: number;

  @ApiProperty({
    type: MeetingQuestionDto,
    nullable: true,
    description: 'Первый вопрос для карточки в списке, null если вопросов нет',
  })
  firstQuestion!: MeetingQuestionDto | null;
}
