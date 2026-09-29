import { Body, Controller, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@common/dto/error-response.dto';
import { ErrorCode } from '@common/enums/error-code.enum';
import { User } from '@users/decorators/user.decorator';
import type { UserProfileDto } from '@users/dto/user-profile.dto';
import { HouseIdParamsDto } from '../houses/dto/house-id-params.dto';
import { CreatePollDto } from './dto/create-poll.dto';
import { PollDto } from './dto/poll.dto';
import { PollsService } from './polls.service';

@ApiTags('Polls')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@ApiConflictResponse({
  type: ErrorResponseDto,
  description: `Пользователь ещё не инициализирован (${ErrorCode.USER_NOT_INITIALIZED})`,
})
@Controller('houses/:houseId/polls')
export class HousePollsController {
  constructor(private readonly polls: PollsService) {}

  @Post()
  @ApiOperation({
    operationId: 'createPoll',
    summary: 'Создать опрос',
    description: 'Создать опрос для жителей этого дома',
  })
  @ApiCreatedResponse({ type: PollDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Проверьте вопрос, варианты ответа и срок',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Дом не найден или недоступен (${ErrorCode.HOUSE_NOT_AVAILABLE})`,
  })
  create(
    @User() user: UserProfileDto,
    @Param() params: HouseIdParamsDto,
    @Body() body: CreatePollDto,
  ): Promise<PollDto> {
    return this.polls.create(user.id, params.houseId, body);
  }
}
