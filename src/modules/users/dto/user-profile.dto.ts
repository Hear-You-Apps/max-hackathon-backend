import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Иван' })
  firstName!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Иванов' })
  lastName!: string | null;

  @ApiProperty({ type: String, nullable: true, example: null })
  username!: string | null;

  @ApiProperty({ type: String, nullable: true, example: null })
  photoUrl!: string | null;
}
