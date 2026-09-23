import { ApiProperty } from '@nestjs/swagger';
import { MeetingListItemDto } from './meeting.dto';

export class MeetingsResponseDto {
  @ApiProperty({
    type: [MeetingListItemDto],
    description: 'Собрания текущей страницы',
  })
  items!: MeetingListItemDto[];

  @ApiProperty({ type: 'integer', example: 1, description: 'Номер страницы' })
  page!: number;

  @ApiProperty({ type: 'integer', example: 20, description: 'Размер страницы' })
  limit!: number;

  @ApiProperty({
    type: 'integer',
    example: 42,
    description: 'Количество собраний за выбранный период',
  })
  total!: number;
}
