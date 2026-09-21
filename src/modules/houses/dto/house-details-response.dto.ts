import { ApiProperty } from '@nestjs/swagger';
import { HouseContactType } from '@generated/prisma/enums';
import { HouseSummaryDto } from './my-houses-response.dto';
import { HouseEventDto } from './house-event.dto';

export class HouseInfoDto extends HouseSummaryDto {
  @ApiProperty({ type: Number, nullable: true, example: 1998 })
  yearBuilt!: number | null;
}

export class HouseContactDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ enum: HouseContactType, enumName: 'HouseContactType' })
  type!: HouseContactType;

  @ApiProperty({ example: 'Диспетчерская УК' })
  name!: string;

  @ApiProperty({ type: String, nullable: true, example: '+78120000000' })
  phone!: string | null;

  @ApiProperty({ type: String, nullable: true })
  address!: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Круглосуточно' })
  workingHours!: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'uri' })
  messengerUrl!: string | null;
}

export class HouseUtilitiesDto {
  @ApiProperty({
    type: String,
    nullable: true,
    format: 'uri',
    description: 'Общая ссылка на оплату или личный кабинет поставщика',
  })
  paymentUrl!: string | null;
}

export class HouseDetailsResponseDto {
  @ApiProperty({ type: HouseInfoDto })
  house!: HouseInfoDto;

  @ApiProperty({ type: [HouseContactDto] })
  contacts!: HouseContactDto[];

  @ApiProperty({ type: HouseUtilitiesDto })
  utilities!: HouseUtilitiesDto;

  @ApiProperty({
    type: [HouseEventDto],
    maxItems: 3,
    description: 'До трёх текущих и ближайших событий по дате начала',
  })
  upcomingEvents!: HouseEventDto[];
}
