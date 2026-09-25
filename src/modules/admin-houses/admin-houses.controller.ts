import { Controller, Get, Header, Param } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
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
import { AdminHouseOverviewResponseDto } from './dto/admin-house-overview-response.dto';
import { AdminHousesService } from './admin-houses.service';

@ApiTags('Admin houses')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@ApiConflictResponse({
  type: ErrorResponseDto,
  description: `Пользователь ещё не инициализирован (${ErrorCode.USER_NOT_INITIALIZED})`,
})
@Controller('admin/houses')
export class AdminHousesController {
  constructor(private readonly adminHouses: AdminHousesService) {}

  @Get(':houseId/overview')
  @Header('Cache-Control', 'private, no-store')
  @ApiOperation({
    operationId: 'getAdminHouseOverview',
    summary: 'Обзор дома для администратора',
    description:
      'Счётчики и заявки требующие внимания. Доступно только подтверждённому администратору этого дома',
  })
  @ApiOkResponse({ type: AdminHouseOverviewResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Неверный ID дома',
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: `Нет прав администратора дома (${ErrorCode.HOUSE_ADMIN_REQUIRED})`,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Дом не найден или недоступен (${ErrorCode.HOUSE_NOT_AVAILABLE})`,
  })
  getOverview(
    @User() user: UserProfileDto,
    @Param() params: HouseIdParamsDto,
  ): Promise<AdminHouseOverviewResponseDto> {
    return this.adminHouses.getOverview(user.id, params.houseId);
  }
}
