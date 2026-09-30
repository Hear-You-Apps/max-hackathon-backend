import { ApiProperty } from '@nestjs/swagger';

export class FileDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: 'd4af5a13-abf9-48f2-8d09-dc62b0297139',
  })
  id!: string;

  @ApiProperty({ example: 'photo.jpg', description: 'Исходное имя файла' })
  name!: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType!: string;

  @ApiProperty({
    type: 'integer',
    example: 245760,
    description: 'Размер в байтах',
  })
  size!: number;

  @ApiProperty({
    example: '/api/files/d4af5a13-abf9-48f2-8d09-dc62b0297139',
    description: 'Скачать по урл',
  })
  url!: string;
}
