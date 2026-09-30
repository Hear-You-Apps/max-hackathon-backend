import { Body, Controller, Param, Put } from '@nestjs/common';
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
import { PollIdParamsDto } from './dto/poll-id-params.dto';
import { PollDto } from './dto/poll.dto';
import { UpdatePollVotesDto } from './dto/update-poll-votes.dto';
import { PollsService } from './polls.service';

@ApiTags('Polls')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@ApiConflictResponse({ type: ErrorResponseDto })
@Controller('polls')
export class PollsController {
  constructor(private readonly polls: PollsService) {}

  @Put(':pollId/votes')
  @ApiOperation({
    operationId: 'updatePollVotes',
    summary: 'Ответить на опрос',
    description:
      'До конца опроса можно поменять ответ или сбросить выбор, передав пустой optionIds',
  })
  @ApiOkResponse({ type: PollDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: `Неверные варианты ответа (${ErrorCode.INVALID_POLL_OPTIONS})`,
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: `Этот опрос доступен другой группе жителей (${ErrorCode.POLL_VOTE_FORBIDDEN})`,
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Опрос не найден или недоступен (${ErrorCode.POLL_NOT_AVAILABLE})`,
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: `Опрос закончился (${ErrorCode.POLL_VOTING_UNAVAILABLE})`,
  })
  updateVotes(
    @User() user: UserProfileDto,
    @Param() params: PollIdParamsDto,
    @Body() body: UpdatePollVotesDto,
  ): Promise<PollDto> {
    return this.polls.updateVotes(user.id, params.pollId, body);
  }
}
