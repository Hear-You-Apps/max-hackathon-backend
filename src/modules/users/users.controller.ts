import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@common/dto/error-response.dto';
import { ErrorCode } from '@common/enums/error-code.enum';
import { User } from './decorators/user.decorator';
import type { UserProfileDto } from './dto/user-profile.dto';
import { UserNotificationsDto } from './dto/user-notifications.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@ApiConflictResponse({
  type: ErrorResponseDto,
  description: `Пользователь ещё не инициализирован (${ErrorCode.USER_NOT_INITIALIZED})`,
})
@Controller('users/me/notifications')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({
    operationId: 'getMyNotifications',
    summary: 'Получить настройки уведомлений',
  })
  @ApiOkResponse({ type: UserNotificationsDto })
  getNotifications(@User() user: UserProfileDto): UserNotificationsDto {
    return { notificationsEnabled: user.notificationsEnabled };
  }

  @Put()
  @ApiOperation({
    operationId: 'updateMyNotifications',
    summary: 'Изменить уведомления',
    description: 'Одна настройка для всех домов',
  })
  @ApiOkResponse({ type: UserNotificationsDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Укажите notificationsEnabled',
  })
  async updateNotifications(
    @User() user: UserProfileDto,
    @Body() body: UserNotificationsDto,
  ): Promise<UserNotificationsDto> {
    return {
      notificationsEnabled: await this.users.updateNotifications(
        user.id,
        body.notificationsEnabled,
      ),
    };
  }
}
