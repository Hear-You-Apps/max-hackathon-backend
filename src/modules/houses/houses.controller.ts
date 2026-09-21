import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiGoneResponse,
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
import {
  HouseNotificationsDto,
  MyHouseJoinRequestDto,
  MyHousesResponseDto,
} from './dto/my-houses-response.dto';
import { JoinHouseDto } from './dto/join-house.dto';
import { LeaveHouseDto } from './dto/leave-house.dto';
import { LeaveHouseMembershipDto } from './dto/leave-house-membership.dto';
import { SearchHouseQueryDto } from './dto/search-house-query.dto';
import { SearchHouseResponseDto } from './dto/search-house-response.dto';
import { UpdateHouseNotificationsDto } from './dto/update-house-notifications.dto';
import { HousesService } from './houses.service';

@ApiTags('Houses')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@ApiConflictResponse({
  type: ErrorResponseDto,
  description: `Пользователь ещё не инициализирован (${ErrorCode.USER_NOT_INITIALIZED})`,
})
@Controller('houses')
export class HousesController {
  constructor(private readonly houses: HousesService) {}

  @Get('me')
  @ApiOperation({
    operationId: 'getMyHouses',
    summary: 'Получение своих домов и заявок на присоединение',
  })
  @ApiOkResponse({ type: MyHousesResponseDto })
  findMine(@User() user: UserProfileDto): Promise<MyHousesResponseDto> {
    return this.houses.findMine(user.id);
  }

  @Get('search')
  @ApiOperation({
    operationId: 'searchHouse',
    summary: 'Поиск дома по коду приглашения',
  })
  @ApiOkResponse({ type: SearchHouseResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Неверный формат кода приглашения',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Приглашение не найдено (${ErrorCode.INVITATION_NOT_FOUND})`,
  })
  @ApiGoneResponse({
    type: ErrorResponseDto,
    description: `Приглашение истекло (${ErrorCode.INVITATION_EXPIRED}) или отозвано (${ErrorCode.INVITATION_REVOKED})`,
  })
  search(
    @User() user: UserProfileDto,
    @Query() query: SearchHouseQueryDto,
  ): Promise<SearchHouseResponseDto> {
    return this.houses.search(user.id, query.code);
  }

  @Post('join')
  @ApiOperation({
    operationId: 'joinHouse',
    summary: 'Подача заявки на присоединение к дому',
  })
  @ApiCreatedResponse({ type: MyHouseJoinRequestDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Неверные данные заявки',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Приглашение не найдено (${ErrorCode.INVITATION_NOT_FOUND})`,
  })
  @ApiGoneResponse({
    type: ErrorResponseDto,
    description: `Приглашение истекло (${ErrorCode.INVITATION_EXPIRED}) или отозвано (${ErrorCode.INVITATION_REVOKED})`,
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: `Пользователь не инициализирован (${ErrorCode.USER_NOT_INITIALIZED}), заявка уже ожидает подтверждения (${ErrorCode.JOIN_REQUEST_ALREADY_EXISTS}), квартира уже привязана (${ErrorCode.APARTMENT_ALREADY_LINKED}) или не определена дата предыдущего выхода (${ErrorCode.HOUSE_REJOIN_UNAVAILABLE})`,
  })
  join(
    @User() user: UserProfileDto,
    @Body() body: JoinHouseDto,
  ): Promise<MyHouseJoinRequestDto> {
    return this.houses.join(user.id, body);
  }

  @Delete('leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'leaveHouse',
    summary: 'Отмена своей заявки на присоединение к дому',
  })
  @ApiNoContentResponse({ description: 'Заявка отменена' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Неверный ID заявки',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Заявка не найдена (${ErrorCode.JOIN_REQUEST_NOT_FOUND})`,
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: `Пользователь не инициализирован (${ErrorCode.USER_NOT_INITIALIZED}) или заявка уже не ожидает подтверждения (${ErrorCode.JOIN_REQUEST_NOT_PENDING})`,
  })
  leave(
    @User() user: UserProfileDto,
    @Body() body: LeaveHouseDto,
  ): Promise<void> {
    return this.houses.leave(user.id, body.requestId);
  }

  @Delete('membership')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'leaveHouseMembership',
    summary: 'Выход из дома',
    description:
      'Выход из подтверждённого дома или удаление дома после исключения. Отменяет ожидающие заявки в этот дом.',
  })
  @ApiNoContentResponse({ description: 'Пользователь вышел из дома' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Неверный ID дома',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Пользователь не состоит в этом доме (${ErrorCode.HOUSE_MEMBERSHIP_NOT_FOUND})`,
  })
  leaveMembership(
    @User() user: UserProfileDto,
    @Body() body: LeaveHouseMembershipDto,
  ): Promise<void> {
    return this.houses.leaveMembership(user.id, body.houseId);
  }

  @Put('notifications')
  @ApiOperation({
    operationId: 'updateHouseNotifications',
    summary: 'Изменение уведомлений дома',
    description:
      'Настройки текущего пользователя в подтверждённом доме. Передайте оба переключателя.',
  })
  @ApiOkResponse({ type: HouseNotificationsDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Неверный ID дома или настройки уведомлений',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Нет подтверждённого членства в доме (${ErrorCode.HOUSE_MEMBERSHIP_NOT_FOUND})`,
  })
  updateNotifications(
    @User() user: UserProfileDto,
    @Body() body: UpdateHouseNotificationsDto,
  ): Promise<HouseNotificationsDto> {
    return this.houses.updateNotifications(user.id, body);
  }
}
