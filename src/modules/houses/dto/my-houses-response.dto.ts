import { ApiProperty } from '@nestjs/swagger';
import {
  ApartmentRelationship,
  ApartmentVerificationStatus,
  HouseJoinRequestStatus,
  HouseMembershipStatus,
  HouseRole,
} from '@generated/prisma/enums';
import { HousePermission } from '../enums/house-permission.enum';

export class HouseSummaryDto {
  @ApiProperty({ example: 10 })
  id!: number;

  @ApiProperty({ example: 'ул. Ленина, 24' })
  address!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Жилсервис' })
  managementCompanyName!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Ссылка для связи с администратором дома',
  })
  adminContactUrl!: string | null;

  @ApiProperty({ type: Number, nullable: true, example: 412 })
  apartmentsCount!: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 6 })
  entrancesCount!: number | null;
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

  @ApiProperty({
    enum: HousePermission,
    enumName: 'HousePermission',
    isArray: true,
    description: 'Права просмотра. При отозванном доступе список пуст.',
  })
  permissions!: HousePermission[];
}

export class MyHouseJoinRequestDto {
  @ApiProperty({ example: 25 })
  id!: number;

  @ApiProperty({ type: HouseSummaryDto })
  house!: HouseSummaryDto;

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

  @ApiProperty({
    enum: HousePermission,
    enumName: 'HousePermission',
    isArray: true,
  })
  permissions!: HousePermission[];
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
