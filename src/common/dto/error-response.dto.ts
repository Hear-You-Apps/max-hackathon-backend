import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorCode } from '../enums/error-code.enum';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['message must be a string'],
  })
  message!: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;

  @ApiPropertyOptional({
    enum: ErrorCode,
    enumName: 'ErrorCode',
    example: ErrorCode.USER_NOT_INITIALIZED,
  })
  code?: ErrorCode;
}
