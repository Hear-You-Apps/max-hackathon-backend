import { ApiProperty } from '@nestjs/swagger';
import { VotingAudience } from '@generated/prisma/enums';

export class PollOptionDto {
  @ApiProperty({ type: 'integer', example: 1 })
  id!: number;

  @ApiProperty({ example: 'Светло-серый' })
  title!: string;

  @ApiProperty({
    type: 'integer',
    description: 'Сколько жителей выбрали вариант',
  })
  votesCount!: number;

  @ApiProperty({
    type: 'integer',
    description:
      'Процент ответивших. При выборе нескольких вариантов сумма может быть больше 100',
  })
  percent!: number;
}

export class PollDto {
  @ApiProperty({ enum: ['poll'] })
  type!: 'poll';

  @ApiProperty({ type: 'integer', example: 1 })
  id!: number;

  @ApiProperty({ type: 'integer', example: 1 })
  houseId!: number;

  @ApiProperty({ example: 'Какой цвет покрасить стены в подъездах?' })
  question!: string;

  @ApiProperty({ enum: VotingAudience, enumName: 'VotingAudience' })
  audience!: VotingAudience;

  @ApiProperty({ type: Boolean })
  allowMultiple!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  endsAt!: string;

  @ApiProperty({ enum: ['active', 'closed'], description: 'По сроку опроса' })
  status!: 'active' | 'closed';

  @ApiProperty({
    type: Boolean,
    description: 'Результат окончательный после срока опроса',
  })
  resultsFinal!: boolean;

  @ApiProperty({
    type: 'integer',
    description: 'Сколько жителей ответили на опрос',
  })
  responsesCount!: number;

  @ApiProperty({ type: [Number], description: 'Выбранные мной варианты' })
  myOptionIds!: number[];

  @ApiProperty({ type: [PollOptionDto] })
  options!: PollOptionDto[];
}
