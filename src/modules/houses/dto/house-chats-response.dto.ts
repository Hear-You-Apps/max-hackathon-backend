import { ApiProperty } from '@nestjs/swagger';
import { HouseChatType } from '@generated/prisma/enums';

export class HouseChatDto {
  @ApiProperty({ type: 'integer', example: 1, description: 'ID записи' })
  id!: number;

  @ApiProperty({
    enum: HouseChatType,
    enumName: 'HouseChatType',
    description: 'chat: чат, channel: канал',
  })
  type!: HouseChatType;

  @ApiProperty({ example: 'Общий чат дома', description: 'Название' })
  name!: string;

  @ApiProperty({ type: String, nullable: true, description: 'Описание' })
  description!: string | null;

  @ApiProperty({ format: 'uri', description: 'Ссылка для открытия в MAX' })
  url!: string;
}

export class HouseChatsResponseDto {
  @ApiProperty({ type: [HouseChatDto], description: 'Чаты и каналы дома' })
  items!: HouseChatDto[];
}
