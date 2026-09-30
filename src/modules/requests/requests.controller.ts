import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@common/dto/error-response.dto';
import { ErrorCode } from '@common/enums/error-code.enum';
import { User } from '@users/decorators/user.decorator';
import type { UserProfileDto } from '@users/dto/user-profile.dto';
import { RequestsService } from './requests.service';
import { RequestIdParamsDto } from './dto/request-id-params.dto';
import { RequestDetailsResponseDto } from './dto/request.dto';

@ApiTags('Requests')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@ApiConflictResponse({
  type: ErrorResponseDto,
  description: `Пользователь ещё не инициализирован (${ErrorCode.USER_NOT_INITIALIZED})`,
})
@Controller('requests')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Get(':requestId')
  @ApiOperation({
    operationId: 'getRequest',
    summary: 'Получение заявки',
    description:
      'Описание, вложения и история обработки. По ссылке заявку видят подтверждённые жители дома',
  })
  @ApiOkResponse({ type: RequestDetailsResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Неверный ID заявки',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Заявка не найдена или недоступна (${ErrorCode.REQUEST_NOT_AVAILABLE})`,
  })
  findOne(
    @User() user: UserProfileDto,
    @Param() params: RequestIdParamsDto,
  ): Promise<RequestDetailsResponseDto> {
    return this.requests.findOne(user.id, params.requestId);
  }

  @Put(':requestId/subscription')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'subscribeToRequest',
    summary: 'Подписаться на заявку',
    description: 'Для жителей этого дома, кроме автора заявки',
  })
  @ApiNoContentResponse({ description: 'Подписка включена' })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: `На свою заявку подписаться нельзя (${ErrorCode.REQUEST_SUBSCRIPTION_FORBIDDEN})`,
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Неверный ID заявки',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Заявка не найдена или недоступна (${ErrorCode.REQUEST_NOT_AVAILABLE})`,
  })
  subscribe(
    @User() user: UserProfileDto,
    @Param() params: RequestIdParamsDto,
  ): Promise<void> {
    return this.requests.subscribe(user.id, params.requestId);
  }

  @Delete(':requestId/subscription')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'unsubscribeFromRequest',
    summary: 'Отписаться от заявки',
  })
  @ApiNoContentResponse({ description: 'Подписка выключена' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Неверный ID заявки',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Заявка не найдена или недоступна (${ErrorCode.REQUEST_NOT_AVAILABLE})`,
  })
  unsubscribe(
    @User() user: UserProfileDto,
    @Param() params: RequestIdParamsDto,
  ): Promise<void> {
    return this.requests.unsubscribe(user.id, params.requestId);
  }
}
