import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength } from 'class-validator';

export class SearchHouseQueryDto {
  @ApiProperty({
    example: 'LEN-24-7Q',
    description: 'Код приглашения',
    maxLength: 64,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString({ message: 'Код приглашения должен быть строкой' })
  @MaxLength(64, { message: 'Код приглашения не должен превышать 64 символа' })
  @Matches(/^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/, {
    message:
      'Код приглашения должен состоять из трёх частей через дефис, например LEN-24-7Q',
  })
  code!: string;
}
