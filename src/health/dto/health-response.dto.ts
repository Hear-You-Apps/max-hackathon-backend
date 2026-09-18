import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok'], example: 'ok' })
  status!: 'ok';

  @ApiProperty({ example: 'max-hackathon-backend' })
  service!: string;

  @ApiProperty({ enum: ['up'], example: 'up' })
  database!: 'up';

  @ApiProperty({ type: String, format: 'date-time' })
  timestamp!: string;
}
