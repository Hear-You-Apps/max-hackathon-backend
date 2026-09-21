import { Controller, Get } from '@nestjs/common';
import {
  ApiConflictResponse,
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
}
