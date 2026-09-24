import { Controller, Get, Header, Param, StreamableFile } from '@nestjs/common';
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
import { FileIdParamsDto } from './dto/file-id-params.dto';
import { FilesService } from './files.service';

@ApiTags('Files')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@ApiConflictResponse({
  type: ErrorResponseDto,
  description: `Пользователь ещё не инициализирован (${ErrorCode.USER_NOT_INITIALIZED})`,
})
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Get(':fileId')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({
    operationId: 'getFile',
    summary: 'Получение файла',
    description:
      'Проверяется доступ к дому и заявке. Для просмотра изображения загрузите его с Authorization и создайте blob URL',
  })
  @ApiOkResponse({
    content: {
      'image/jpeg': { schema: { type: 'string', format: 'binary' } },
      'image/png': { schema: { type: 'string', format: 'binary' } },
      'image/webp': { schema: { type: 'string', format: 'binary' } },
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Неверный ID файла',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Файл не найден или недоступен (${ErrorCode.FILE_NOT_AVAILABLE})`,
  })
  download(
    @User() user: UserProfileDto,
    @Param() params: FileIdParamsDto,
  ): Promise<StreamableFile> {
    return this.files.download(user.id, params.fileId);
  }
}
