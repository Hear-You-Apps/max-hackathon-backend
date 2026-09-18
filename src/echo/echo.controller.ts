import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { EchoDto } from './dto/echo.dto';

@ApiTags('Echo')
@Controller('echo')
export class EchoController {
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'echo', summary: 'Return a validated message' })
  @ApiOkResponse({ type: EchoDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  echo(@Body() body: EchoDto): EchoDto {
    return { message: body.message };
  }
}
