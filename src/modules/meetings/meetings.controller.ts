import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '@common/dto/error-response.dto';
import { ErrorCode } from '@common/enums/error-code.enum';
import { User } from '@users/decorators/user.decorator';
import type { UserProfileDto } from '@users/dto/user-profile.dto';
import { PollDto } from '../polls/dto/poll.dto';
import { MeetingDetailsResponseDto } from './dto/meeting-details-response.dto';
import { MeetingIdParamsDto } from './dto/meeting-id-params.dto';
import { MeetingItemIdParamsDto } from './dto/meeting-item-id-params.dto';
import { MeetingsService } from './meetings.service';
import { MeetingVotesService } from './meeting-votes.service';
import { MeetingParticipationService } from './meeting-participation.service';
import {
  MeetingParticipationResponseDto,
  UpdateMeetingParticipationDto,
} from './dto/meeting-participation.dto';
import {
  MeetingVotesResponseDto,
  UpdateMeetingVotesDto,
} from './dto/meeting-votes.dto';

@ApiTags('Meetings')
@ApiExtraModels(MeetingDetailsResponseDto, PollDto)
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
    private readonly participation: MeetingParticipationService,
  ) {}

  @Put(':meetingId/participation')
  @ApiOperation({
    operationId: 'updateMeetingParticipation',
    summary: 'Приду или не приду на собрание',
    description:
      'Для подтверждённых жителей дома, включая нанимателей. Ответ можно менять до начала очного или очно-заочного собрания',
  })
  @ApiOkResponse({ type: MeetingParticipationResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Неверный ID собрания или willAttend',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Собрание не найдено или недоступно (${ErrorCode.MEETING_NOT_AVAILABLE})`,
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: `Запись закрыта по сроку, формату или отмене (${ErrorCode.MEETING_PARTICIPATION_UNAVAILABLE}), либо пользователь ещё не инициализирован (${ErrorCode.USER_NOT_INITIALIZED})`,
  })
  updateParticipation(
    @User() user: UserProfileDto,
    @Param() params: MeetingIdParamsDto,
    @Body() body: UpdateMeetingParticipationDto,
  ): Promise<MeetingParticipationResponseDto> {
    return this.participation.update(user.id, params.meetingId, body);
  }

  @Put(':meetingId/votes')
  @ApiOperation({
    operationId: 'updateMeetingVotes',
    summary: 'Голосование по вопросам собрания',
    description:
      'Кто может голосовать зависит от аудитории собрания. Пока голосование открыто, можно менять ответы или сбросить все свои ответы, передав пустой votes',
  })
  @ApiOkResponse({ type: MeetingVotesResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: `Неверные ответы или вопросы другого собрания (${ErrorCode.INVALID_MEETING_QUESTIONS})`,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: `Для собрания собственников нет подтверждённой квартиры (${ErrorCode.MEETING_VOTE_FORBIDDEN})`,
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

  @Get(':itemId')
  @ApiOperation({
    operationId: 'getMeetingItem',
    summary: 'Получение собрания или опроса',
    description:
      'Передайте ID из списка вместе с типом: meeting_154 или poll_154',
  })
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(MeetingDetailsResponseDto) },
        { $ref: getSchemaPath(PollDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          meeting: getSchemaPath(MeetingDetailsResponseDto),
          poll: getSchemaPath(PollDto),
        },
      },
    },
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Неверный ID собрания или опроса',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Собрание или опрос не найден либо недоступен (${ErrorCode.MEETING_NOT_AVAILABLE}, ${ErrorCode.POLL_NOT_AVAILABLE})`,
  })
  findOne(
    @User() user: UserProfileDto,
    @Param() params: MeetingItemIdParamsDto,
  ): Promise<MeetingDetailsResponseDto | PollDto> {
    return this.meetings.findItem(user.id, params.itemId);
  }
}
