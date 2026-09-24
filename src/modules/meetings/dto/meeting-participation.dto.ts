import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateMeetingParticipationDto {
  @ApiProperty({ description: 'true: приду, false: не приду', example: true })
  @IsBoolean({ message: 'Укажите true или false' })
  willAttend!: boolean;
}

export class MeetingParticipationResponseDto {
  @ApiProperty({
    type: Boolean,
    nullable: true,
    example: true,
    description: 'Свой ответ, null если ещё не отмечались',
  })
  willAttend!: boolean | null;

  @ApiProperty({
    type: 'integer',
    example: 12,
    description: 'Сколько подтверждённых жителей планируют прийти',
  })
  goingCount!: number;
}
