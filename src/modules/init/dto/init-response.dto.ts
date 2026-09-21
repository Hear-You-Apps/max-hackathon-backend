import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from '../../users/dto/user-profile.dto';
import { MyHousesResponseDto } from '../../houses/dto/my-houses-response.dto';

export class InitResponseDto extends MyHousesResponseDto {
  @ApiProperty({ type: UserProfileDto })
  user!: UserProfileDto;
}
