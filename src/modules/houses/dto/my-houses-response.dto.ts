import { ApiProperty } from '@nestjs/swagger';
import {
  ApartmentRelationship,
  ApartmentVerificationStatus,
  HouseJoinRequestStatus,
  HouseMembershipStatus,
  HouseRole,
} from '@generated/prisma/enums';

export class HousePreviewDto {
  @ApiProperty({ example: 10 })
  id!: number;

  @ApiProperty({ example: 'ул. Ленина, 24' })
  address!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Жилсервис' })
  managementCompanyName!: string | null;

  @ApiProperty({ type: Number, nullable: true, example: 412 })
  apartmentsCount!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 6 })
  entrancesCount!: number | null;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 286,
    description: 'Количество подтверждённых жителей дома',
  })
  residentsCount!: number;
}

export class HouseSummaryDto extends HousePreviewDto {
  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Ссылка для связи с администратором дома. Доступна при подтверждённом членстве.',
  })
  adminContactUrl!: string | null;
}

export class HouseNotificationsDto {
  @ApiProperty({ example: true })
  meetings!: boolean;

  @ApiProperty({ example: true })
  requests!: boolean;
}

export class MyApartmentDto {
  @ApiProperty({ example: 105 })
  id!: number;

  @ApiProperty({ example: '112' })
  number!: string;

  @ApiProperty({
    enum: ApartmentRelationship,
    enumName: 'ApartmentRelationship',
  })
  relationship!: ApartmentRelationship;

  @ApiProperty({
    enum: ApartmentVerificationStatus,
    enumName: 'ApartmentVerificationStatus',
  })
  verificationStatus!: ApartmentVerificationStatus;
}

export class MyHouseMembershipDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({
    enum: HouseMembershipStatus,
    enumName: 'HouseMembershipStatus',
  })
  status!: HouseMembershipStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Причина отзыва доступа к дому',
  })
  revocationReason!: string | null;

  @ApiProperty({ example: 'Александр Кузнецов' })
  displayName!: string;

  @ApiProperty({ enum: HouseRole, enumName: 'HouseRole', isArray: true })
  roles!: HouseRole[];

  @ApiProperty({ type: [MyApartmentDto] })
  apartments!: MyApartmentDto[];

  @ApiProperty({ type: HouseNotificationsDto })
  notifications!: HouseNotificationsDto;
}

export class MyHouseDto extends HouseSummaryDto {
  @ApiProperty({ type: MyHouseMembershipDto })
  membership!: MyHouseMembershipDto;
}

export class MyHouseJoinRequestDto {
  @ApiProperty({ example: 25 })
  id!: number;

  @ApiProperty({ type: HousePreviewDto })
  house!: HousePreviewDto;

  @ApiProperty({ example: '112' })
  apartmentNumber!: string;

  @ApiProperty({ example: 'Александр Кузнецов' })
  displayName!: string;

  @ApiProperty({
    enum: ApartmentRelationship,
    enumName: 'ApartmentRelationship',
  })
  relationship!: ApartmentRelationship;

  @ApiProperty({
    enum: HouseJoinRequestStatus,
    enumName: 'HouseJoinRequestStatus',
  })
  status!: HouseJoinRequestStatus;

  @ApiProperty({ type: String, nullable: true, example: null })
  rejectionReason!: string | null;

  @ApiProperty({ type: HouseNotificationsDto })
  notifications!: HouseNotificationsDto;
}

export class MyHousesResponseDto {
  @ApiProperty({
    type: [MyHouseDto],
    description:
      'Дома с подтверждённым или отозванным доступом. Покинутые дома не возвращаются.',
  })
  houses!: MyHouseDto[];

  @ApiProperty({
    type: [MyHouseJoinRequestDto],
    description:
      'Последние заявки по каждой квартире, ожидающие подтверждения или отклонённые. Заявки до последнего выхода из дома не возвращаются.',
  })
  joinRequests!: MyHouseJoinRequestDto[];
}
