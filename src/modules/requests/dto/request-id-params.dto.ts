import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RequestIdParamsDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: 'abf319d9-b173-4aeb-b9bb-7ca6e15e6df8',
  })
  @IsUUID('4', { message: 'Неверный ID заявки' })
  requestId!: string;
}
