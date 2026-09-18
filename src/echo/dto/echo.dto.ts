import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class EchoDto {
  @ApiProperty({ example: 'Hello, Max!', minLength: 1, maxLength: 500 })
  @IsString()
  @Length(1, 500)
  message!: string;
}
