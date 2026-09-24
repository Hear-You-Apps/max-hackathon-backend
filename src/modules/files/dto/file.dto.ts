import { ApiProperty } from '@nestjs/swagger';

export class FileDto {
  @ApiProperty({ type: 'integer', example: 1 })
  id!: number;

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
    example: '/api/files/1',
    description: 'Скачать по урл',
  })
  url!: string;
}
