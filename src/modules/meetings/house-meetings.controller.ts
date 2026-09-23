import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
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
import { MeetingsQueryDto } from './dto/meetings-query.dto';
import { MeetingsResponseDto } from './dto/meetings-response.dto';
import { MeetingsService } from './meetings.service';
import { MeetingCreationService } from './meeting-creation.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { MeetingDetailsResponseDto } from './dto/meeting-details-response.dto';

@ApiTags('Meetings')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@ApiConflictResponse({
  type: ErrorResponseDto,
  description: `Пользователь ещё не инициализирован (${ErrorCode.USER_NOT_INITIALIZED})`,
})
@Controller('houses/:houseId/meetings')
export class HouseMeetingsController {
  constructor(
    private readonly meetings: MeetingsService,
    private readonly creation: MeetingCreationService,
  ) {}

  @Post()
  @ApiOperation({
    operationId: 'createMeeting',
    summary: 'Создание собрания',
    description:
      'Доступно подтверждённым собственникам, организаторам, совету дома и админам. Собрание сразу появится в списке, без модерации',
  })
  @ApiCreatedResponse({ type: MeetingDetailsResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: `Неверные поля, даты (${ErrorCode.INVALID_MEETING_DATES}) или не указано место (${ErrorCode.MEETING_LOCATION_REQUIRED})`,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: `Нет права создавать собрания (${ErrorCode.MEETING_CREATE_FORBIDDEN})`,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Дом не найден или недоступен (${ErrorCode.HOUSE_NOT_AVAILABLE})`,
  })
  create(
    @User() user: UserProfileDto,
    @Param() params: HouseIdParamsDto,
    @Body() body: CreateMeetingDto,
  ): Promise<MeetingDetailsResponseDto> {
    return this.creation.create(user.id, params.houseId, body);
  }

  @Get()
  @ApiOperation({
    operationId: 'getHouseMeetings',
    summary: 'Получение собраний дома',
    description:
      'Актуальные идут по дате начала от ближайших, прошедшие по дате окончания от новых. Доступно подтверждённым жителям дома',
  })
  @ApiOkResponse({ type: MeetingsResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Неверный ID дома, период или параметры пагинации',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Дом не найден или недоступен (${ErrorCode.HOUSE_NOT_AVAILABLE})`,
  })
  findAll(
    @User() user: UserProfileDto,
    @Param() params: HouseIdParamsDto,
    @Query() query: MeetingsQueryDto,
  ): Promise<MeetingsResponseDto> {
    return this.meetings.findAll(user.id, params.houseId, query);
  }
}
