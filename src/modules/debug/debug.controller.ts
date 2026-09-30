import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@auth/public.decorator';
import { ErrorResponseDto } from '@common/dto/error-response.dto';
import { DebugService } from './debug.service';
import { DeleteUserDto } from './dto/delete-user.dto';
import {
  RejectJoinRequestDto,
  ReviewJoinRequestDto,
} from './dto/review-join-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';

@ApiTags('Debug')
@Public()
@ApiBadRequestResponse({ type: ErrorResponseDto })
@Controller('debug')
export class DebugController {
  constructor(private readonly debug: DebugService) {}

  @Delete('users')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'debugDeleteUser',
    summary: 'Удаление пользователя и его связей с домами',
    security: [],
  })
  @ApiNoContentResponse({ description: 'Пользователь удалён' })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Пользователь не найден',
  })
  deleteUser(@Body() body: DeleteUserDto): Promise<void> {
    return this.debug.deleteUser(body.userId);
  }

  @Post('houses/approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'debugApproveJoinRequest',
    summary: 'Одобрение заявки на присоединение к дому',
    security: [],
  })
  @ApiNoContentResponse({ description: 'Заявка одобрена, квартира привязана' })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Заявка не найдена',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Заявка уже рассмотрена или устарела',
  })
  approve(@Body() body: ReviewJoinRequestDto): Promise<void> {
    return this.debug.review(body.requestId, 'approved');
  }

  @Post('houses/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'debugRejectJoinRequest',
    summary: 'Отклонение заявки на присоединение к дому',
    security: [],
  })
  @ApiNoContentResponse({ description: 'Заявка отклонена' })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Заявка не найдена',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Заявка уже рассмотрена или устарела',
  })
  reject(@Body() body: RejectJoinRequestDto): Promise<void> {
    return this.debug.review(body.requestId, 'rejected', body.reason);
  }

  @Post('requests/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    operationId: 'debugUpdateRequestStatus',
    summary: 'Изменить статус заявки',
    security: [],
  })
  @ApiNoContentResponse({ description: 'Статус обновлён' })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'Заявка не найдена',
  })
  updateRequestStatus(@Body() body: UpdateRequestStatusDto): Promise<void> {
    return this.debug.updateRequestStatus(
      body.requestId,
      body.status,
      body.comment,
    );
  }
}
