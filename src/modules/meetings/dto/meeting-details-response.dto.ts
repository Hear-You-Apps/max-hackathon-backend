import { ApiProperty } from '@nestjs/swagger';
import { MeetingDto, MeetingQuestionDto } from './meeting.dto';
import { MeetingParticipationResponseDto } from './meeting-participation.dto';

export class MeetingAuthorDto {
  @ApiProperty({ type: 'integer', example: 1 })
  id!: number;

  @ApiProperty({ example: 'Олег Чикелев', description: 'Имя автора' })
  name!: string;
}

export class MeetingDetailsResponseDto extends MeetingDto {
  @ApiProperty({
    type: MeetingParticipationResponseDto,
    nullable: true,
    description:
      'Свой ответ и число планирующих прийти, null для заочного собрания',
  })
  participation!: MeetingParticipationResponseDto | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Обсудим въезд во двор и стоимость установки',
  })
  description!: string | null;

  @ApiProperty({
    type: MeetingAuthorDto,
    nullable: true,
    description: 'Автор собрания, null если аккаунт удалён',
  })
  author!: MeetingAuthorDto | null;

  @ApiProperty({
    type: [MeetingQuestionDto],
    description: 'Вопросы в порядке повестки',
  })
  questions!: MeetingQuestionDto[];
}
