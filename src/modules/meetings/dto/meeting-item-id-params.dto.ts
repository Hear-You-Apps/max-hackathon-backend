import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class MeetingItemIdParamsDto {
  @ApiProperty({
    type: String,
    example: 'meeting_154',
    description: 'meeting_154 или poll_154',
    pattern: '^(meeting|poll)_[1-9][0-9]{0,9}$',
  })
  @Matches(/^(meeting|poll)_[1-9]\d{0,9}$/, {
    message:
      'Укажите ID собрания или опроса в формате meeting_154 или poll_154',
  })
  itemId!: string;
}
