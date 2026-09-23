import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
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

@ApiTags('Meetings')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@ApiConflictResponse({
  type: ErrorResponseDto,
  description: `Пользователь ещё не инициализирован (${ErrorCode.USER_NOT_INITIALIZED})`,
})
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetings: MeetingsService) {}

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
