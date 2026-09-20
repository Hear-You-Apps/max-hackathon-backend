import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { EchoDto } from './dto/echo.dto';

@ApiTags('Echo')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@ApiConflictResponse({
  type: ErrorResponseDto,
  description: `Пользователь ещё не инициализирован (${ErrorCode.USER_NOT_INITIALIZED})`,
})
@Controller('echo')
export class EchoController {
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'echo',
    summary: 'Проверка и возврат сообщения',
  })
  @ApiOkResponse({ type: EchoDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  echo(@Body() body: EchoDto): EchoDto {
    return { message: body.message };
  }
}
