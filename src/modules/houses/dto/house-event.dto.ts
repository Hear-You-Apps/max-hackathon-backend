import { ApiProperty } from '@nestjs/swagger';
import { HouseEventType } from '@generated/prisma/enums';

export class HouseEventDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ enum: HouseEventType, enumName: 'HouseEventType' })
  type!: HouseEventType;

  @ApiProperty({ example: 'Отключение горячей воды' })
  title!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Плановые работы' })
  description!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-10-01T07:00:00.000Z',
  })
  startsAt!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2026-10-01T13:00:00.000Z',
  })
  endsAt!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Подъезды 1–3' })
  location!: string | null;

  @ApiProperty({ example: false })
  isCancelled!: boolean;
}
