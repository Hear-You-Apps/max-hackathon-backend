import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from '../../users/dto/user-profile.dto';

export class InitResponseDto {
  @ApiProperty({ type: UserProfileDto })
  user!: UserProfileDto;
}
