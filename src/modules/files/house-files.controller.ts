import {
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Express } from 'express';
import { ErrorResponseDto } from '@common/dto/error-response.dto';
import { ErrorCode } from '@common/enums/error-code.enum';
import { User } from '@users/decorators/user.decorator';
import type { UserProfileDto } from '@users/dto/user-profile.dto';
import { HouseIdParamsDto } from '../houses/dto/house-id-params.dto';
import { FileDto } from './dto/file.dto';
import { MAX_FILE_SIZE } from './files.constants';
import { FilesService } from './files.service';

@ApiTags('Files')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@ApiConflictResponse({
  type: ErrorResponseDto,
  description: `Пользователь ещё не инициализирован (${ErrorCode.USER_NOT_INITIALIZED})`,
})
@Controller('houses/:houseId/files')
export class HouseFilesController {
  constructor(private readonly files: FilesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 0 },
    }),
  )
  @ApiOperation({
    operationId: 'uploadHouseFile',
    summary: 'Загрузка файла для заявки',
    description:
      'JPEG, PNG, WebP или PDF до 10 МБ. До привязки к заявке файл доступен только загрузившему его жителю',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({ type: FileDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: `Неверный ID дома, файл или формат запроса (${ErrorCode.INVALID_FILE})`,
  })
  @ApiPayloadTooLargeResponse({
    type: ErrorResponseDto,
    description: 'Файл больше 10 МБ',
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: `Дом не найден или недоступен (${ErrorCode.HOUSE_NOT_AVAILABLE})`,
  })
  upload(
    @User() user: UserProfileDto,
    @Param() params: HouseIdParamsDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<FileDto> {
    return this.files.upload(user.id, params.houseId, file);
  }
}
