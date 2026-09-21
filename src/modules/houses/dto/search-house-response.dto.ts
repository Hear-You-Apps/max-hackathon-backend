import { ApiProperty } from '@nestjs/swagger';
import {
  HouseSummaryDto,
  MyHouseJoinRequestDto,
  MyHouseMembershipDto,
} from './my-houses-response.dto';

export class FoundHouseDto extends HouseSummaryDto {
  @ApiProperty({
    example: 286,
    description: 'Количество пользователей с подтверждённым доступом к дому',
  })
  residentsCount!: number;
}

export class SearchHouseResponseDto {
  @ApiProperty({ type: FoundHouseDto })
  house!: FoundHouseDto;

  @ApiProperty({
    type: MyHouseMembershipDto,
    nullable: true,
    description:
      'Связь текущего пользователя с домом. При отсутствии связи или после выхода возвращается null.',
  })
  membership!: MyHouseMembershipDto | null;

  @ApiProperty({
    type: MyHouseJoinRequestDto,
    nullable: true,
    description:
      'Последняя актуальная заявка текущего пользователя в этот дом либо null. Полный список доступен в /houses/me.',
  })
  joinRequest!: MyHouseJoinRequestDto | null;
}
