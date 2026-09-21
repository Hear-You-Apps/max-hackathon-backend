import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AllowUninitialized } from '@users/decorators/allow-uninitialized.decorator';
import { MaxUser } from '@auth/max-user.decorator';
import type { MaxUserData } from '@auth/auth.types';
import { ErrorResponseDto } from '@common/dto/error-response.dto';
import { InitResponseDto } from './dto/init-response.dto';
import { InitService } from './init.service';

@ApiTags('Init')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@Controller('init')
export class InitController {
  constructor(private readonly initService: InitService) {}

  @Post()
  @AllowUninitialized()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'init',
    summary: 'Инициализация текущего пользователя',
  })
  @ApiOkResponse({ type: InitResponseDto })
  initialize(@MaxUser() user: MaxUserData): Promise<InitResponseDto> {
    return this.initService.initialize(user);
  }
}
