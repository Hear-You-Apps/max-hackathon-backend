import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FileIdParamsDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: 'd4af5a13-abf9-48f2-8d09-dc62b0297139',
  })
  @IsUUID('4', { message: 'Неверный ID файла' })
  fileId!: string;
}
