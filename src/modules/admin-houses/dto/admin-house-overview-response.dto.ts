import { ApiProperty, PickType } from '@nestjs/swagger';
import { ApartmentRelationship } from '@generated/prisma/enums';
import { HousePreviewDto } from '../../houses/dto/my-houses-response.dto';
import { RequestDto } from '../../requests/dto/request.dto';

export class AdminHouseStatsDto {
  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 12,
    description: 'Новые заявки в УК со статусом submitted, включая приватные',
  })
  newRequestsCount!: number;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 22,
    description:
      'Все заявки в УК кроме closed и cancelled, включая новые и приватные',
  })
  openRequestsCount!: number;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 12,
    description:
      'Актуальные заявки на вступление со статусом pending, по каждой квартире отдельно',
  })
  pendingJoinRequestsCount!: number;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 286,
    description:
      'Пользователи с approved в этом доме, каждый считается один раз',
  })
  residentsCount!: number;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 2,
    description: 'Уже начавшиеся и ещё не завершённые собрания, без отменённых',
  })
  activeMeetingsCount!: number;
}

export class AdminRequestPreviewDto extends PickType(RequestDto, [
  'id',
  'title',
  'category',
  'status',
  'createdAt',
] as const) {}

export class AdminJoinRequestPreviewDto {
  @ApiProperty({
    type: 'integer',
    example: 25,
    description: 'ID заявки на вступление',
  })
  id!: number;

  @ApiProperty({ example: '112' })
  apartmentNumber!: string;

  @ApiProperty({ example: 'Мане Айрапетян' })
  displayName!: string;

  @ApiProperty({
    enum: ApartmentRelationship,
    enumName: 'ApartmentRelationship',
  })
  relationship!: ApartmentRelationship;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-09-27T09:12:00.000Z',
  })
  createdAt!: string;
}

export class AdminHouseAttentionDto {
  @ApiProperty({
    type: [AdminRequestPreviewDto],
    maxItems: 5,
    description: 'До 5 заявок в УК со статусом submitted, сначала самые старые',
  })
  requests!: AdminRequestPreviewDto[];

  @ApiProperty({
    type: [AdminJoinRequestPreviewDto],
    maxItems: 5,
    description:
      'До 5 актуальных заявок на вступление со статусом pending, сначала самые старые',
  })
  joinRequests!: AdminJoinRequestPreviewDto[];
}

export class AdminHouseOverviewResponseDto {
  @ApiProperty({ type: HousePreviewDto })
  house!: HousePreviewDto;

  @ApiProperty({ type: AdminHouseStatsDto })
  stats!: AdminHouseStatsDto;

  @ApiProperty({ type: AdminHouseAttentionDto })
  attention!: AdminHouseAttentionDto;
}
