import { ApiProperty } from '@nestjs/swagger';
import {
  MeetingFormat,
  MeetingVoteChoice,
  VotingAudience,
} from '@generated/prisma/enums';
import { MeetingStatus } from '../enums/meeting-status.enum';

export class MeetingVoteResultsDto {
  @ApiProperty({ type: 'integer', example: 42, description: 'Голоса за' })
  yes!: number;

  @ApiProperty({ type: 'integer', example: 8, description: 'Голоса против' })
  no!: number;

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

  @ApiProperty({ enum: VotingAudience, enumName: 'VotingAudience' })
  audience!: VotingAudience;

  @ApiProperty({
    enum: MeetingStatus,
    enumName: 'MeetingStatus',
    description:
      'scheduled: ещё не началось, active: идёт, closed: завершено, cancelled: отменено',
  })
  status!: MeetingStatus;

  @ApiProperty({
    type: Boolean,
    description:
      'Голосование закончено, результаты больше не меняются от новых голосов',
  })
  resultsFinal!: boolean;

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

  @ApiProperty({
    type: 'integer',
    nullable: true,
    example: 50,
    description: 'Порог участия от числа квартир, null если не задан',
  })
  participationThresholdPercent!: number | null;

  @ApiProperty({
    type: 'integer',
    nullable: true,
    example: 412,
    description: 'Количество квартир дома, null если не указано',
  })
  apartmentsCount!: number | null;

  @ApiProperty({
    type: 'integer',
    example: 213,
    description: 'Квартиры, от которых голосовали или отметили «Приду»',
  })
  participatingApartmentsCount!: number;

  @ApiProperty({
    type: Boolean,
    nullable: true,
    description:
      'null если порог участия не задан или число квартир неизвестно',
  })
  participationThresholdReached!: boolean | null;
}

export class MeetingListItemDto extends MeetingDto {
  @ApiProperty({ enum: ['meeting'] })
  type!: 'meeting';

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
