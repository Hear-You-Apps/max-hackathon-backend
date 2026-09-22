import { ApiProperty } from '@nestjs/swagger';
import { HouseEventDto } from './house-event.dto';

export class HouseEventsResponseDto {
  @ApiProperty({
    type: [HouseEventDto],
    description: 'События текущей страницы',
  })
  items!: HouseEventDto[];

  @ApiProperty({ type: 'integer', example: 1, description: 'Номер страницы' })
  page!: number;

  @ApiProperty({ type: 'integer', example: 20, description: 'Размер страницы' })
  limit!: number;

  @ApiProperty({
    type: 'integer',
    example: 42,
    description: 'Общее количество событий дома с учётом выбранного периода',
  })
  total!: number;
}
