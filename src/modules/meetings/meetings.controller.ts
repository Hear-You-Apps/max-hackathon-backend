import { Body, Controller, Get, Param, Put } from '@nestjs/common';
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
import { MeetingDetailsResponseDto } from './dto/meeting-details-response.dto';
import { MeetingIdParamsDto } from './dto/meeting-id-params.dto';
import { MeetingsService } from './meetings.service';
import { MeetingVotesService } from './meeting-votes.service';
import {
  MeetingVotesResponseDto,
  UpdateMeetingVotesDto,
} from './dto/meeting-votes.dto';

@ApiTags('Meetings')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@ApiConflictResponse({
  type: ErrorResponseDto,
  description: `Пользователь ещё не инициализирован (${ErrorCode.USER_NOT_INITIALIZED})`,
})
@Controller('meetings')
export class MeetingsController {
  constructor(
    private readonly meetings: MeetingsService,
    private readonly votes: MeetingVotesService,
  ) {}

  @Put(':meetingId/votes')
  @ApiOperation({
    operationId: 'updateMeetingVotes',
    summary: 'Голосование по вопросам собрания',
    description:
      'Предварительное голосование для подтверждённых собственников. Можно ответить на один вопрос или несколько и поменять ответ до окончания. Остальные ответы сохраняются',
  })
  @ApiOkResponse({ type: MeetingVotesResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: `Неверные ответы или вопросы другого собрания (${ErrorCode.INVALID_MEETING_QUESTIONS})`,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: `Нет подтверждённой квартиры собственника (${ErrorCode.MEETING_VOTE_FORBIDDEN})`,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Собрание не найдено или недоступно (${ErrorCode.MEETING_NOT_AVAILABLE})`,
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: `Голосование недоступно по сроку, формату или отмене (${ErrorCode.MEETING_VOTING_UNAVAILABLE}), либо пользователь ещё не инициализирован (${ErrorCode.USER_NOT_INITIALIZED})`,
  })
  updateVotes(
    @User() user: UserProfileDto,
    @Param() params: MeetingIdParamsDto,
    @Body() body: UpdateMeetingVotesDto,
  ): Promise<MeetingVotesResponseDto> {
    return this.votes.update(user.id, params.meetingId, body);
  }

  @Get(':meetingId')
  @ApiOperation({
    operationId: 'getMeeting',
    summary: 'Получение собрания',
    description: 'Вопросы, результаты и свои голоса',
  })
  @ApiOkResponse({ type: MeetingDetailsResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Неверный ID собрания',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Собрание не найдено или недоступно (${ErrorCode.MEETING_NOT_AVAILABLE})`,
  })
  findOne(
    @User() user: UserProfileDto,
    @Param() params: MeetingIdParamsDto,
  ): Promise<MeetingDetailsResponseDto> {
    return this.meetings.findOne(user.id, params.meetingId);
  }
}
