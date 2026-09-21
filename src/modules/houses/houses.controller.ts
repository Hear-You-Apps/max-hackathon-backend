import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiGoneResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { User } from '../users/decorators/user.decorator';
import type { UserProfileDto } from '../users/dto/user-profile.dto';
import { MyHousesResponseDto } from './dto/my-houses-response.dto';
import { SearchHouseQueryDto } from './dto/search-house-query.dto';
import { SearchHouseResponseDto } from './dto/search-house-response.dto';
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
}
