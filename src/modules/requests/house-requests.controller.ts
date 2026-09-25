import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@common/dto/error-response.dto';
import { ErrorCode } from '@common/enums/error-code.enum';
import { User } from '@users/decorators/user.decorator';
import type { UserProfileDto } from '@users/dto/user-profile.dto';
import { HouseIdParamsDto } from '../houses/dto/house-id-params.dto';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestsQueryDto } from './dto/requests-query.dto';
import {
  RequestDetailsResponseDto,
  RequestsResponseDto,
} from './dto/request.dto';
import { RequestsService } from './requests.service';

@ApiTags('Requests')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@ApiConflictResponse({
  type: ErrorResponseDto,
  description: `Пользователь ещё не инициализирован (${ErrorCode.USER_NOT_INITIALIZED})`,
})
@ApiNotFoundResponse({
  type: ErrorResponseDto,
  description: `Дом не найден или недоступен (${ErrorCode.HOUSE_NOT_AVAILABLE})`,
})
@Controller('houses/:houseId/requests')
export class HouseRequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Get()
  @ApiOperation({
    operationId: 'getHouseRequests',
    summary: 'Получение заявок дома',
    description:
      'Свои или открытые соседям заявки, новые сверху. Доступно подтверждённым жителям',
  })
  @ApiOkResponse({ type: RequestsResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Неверный ID дома или фильтры',
  })
  findAll(
    @User() user: UserProfileDto,
    @Param() params: HouseIdParamsDto,
    @Query() query: RequestsQueryDto,
  ): Promise<RequestsResponseDto> {
    return this.requests.findAll(user.id, params.houseId, query);
  }

  @Post()
  @ApiOperation({
    operationId: 'createRequest',
    summary: 'Создание заявки',
    description:
      'Для подтверждённых жителей дома. Файлы сначала загрузите через POST /houses/:houseId/files',
  })
  @ApiCreatedResponse({ type: RequestDetailsResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: `Неверные поля, место (${ErrorCode.INVALID_REQUEST_LOCATION}), квартира (${ErrorCode.REQUEST_APARTMENT_NOT_AVAILABLE}) или вложения (${ErrorCode.REQUEST_ATTACHMENTS_NOT_AVAILABLE})`,
  })
  create(
    @User() user: UserProfileDto,
    @Param() params: HouseIdParamsDto,
    @Body() body: CreateRequestDto,
  ): Promise<RequestDetailsResponseDto> {
    return this.requests.create(user.id, params.houseId, body);
  }
}
