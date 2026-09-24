import { randomUUID } from 'node:crypto';
import { mkdir, open, rm } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import {
  BadRequestException,
  FileTypeValidator,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Express } from 'express';
import { Environment } from '@config/environment';
import { ErrorCode } from '@common/enums/error-code.enum';
import { Prisma } from '@generated/prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { HouseAccessService } from '../houses/services/house-access.service';
import { RequestAccessService } from '../requests/request-access.service';
import type { FileDto } from './dto/file.dto';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from './files.constants';
import { toFileResponse } from './internal/file.mapper';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly directory: string;
  private readonly typeValidator = new FileTypeValidator({
    fileType: ALLOWED_FILE_TYPES,
    overrideMimeType: true,
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly houseAccess: HouseAccessService,
    private readonly requestAccess: RequestAccessService,
    config: ConfigService<Environment, true>,
  ) {
    this.directory = resolve(config.get('UPLOADS_DIR', { infer: true }));
  }

  async upload(
    userId: number,
    houseId: number,
    file?: Express.Multer.File,
  ): Promise<FileDto> {
    if (
      !file ||
      !file.size ||
      file.size > MAX_FILE_SIZE ||
      !(await this.typeValidator.isValid(file))
    ) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        code: ErrorCode.INVALID_FILE,
        message: 'Прикрепите JPEG, PNG, WebP или PDF до 10 МБ',
      });
    }
    const originalName =
      Array.from(
        basename(file.originalname.replaceAll('\\', '/')).replace(
          /\p{Cc}/gu,
          '',
        ),
      )
        .slice(0, 255)
        .join('') || 'file';
    const storageKey = randomUUID();
    const path = join(this.directory, storageKey);
    let fileCreated = false;
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
          await this.houseAccess.checkAccess(tx, userId, houseId);
          await mkdir(this.directory, { recursive: true, mode: 0o700 });
          const handle = await open(path, 'wx', 0o600);
          fileCreated = true;
          try {
            await handle.writeFile(file.buffer);
          } finally {
            await handle.close();
          }
          const stored = await tx.storedFile.create({
            data: {
              houseId,
              ownerId: userId,
              storageKey,
              originalName,
              mimeType: file.mimetype,
              size: file.size,
            },
          });
          return toFileResponse(stored);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
      );
    } catch (error) {
      if (fileCreated) {
        await rm(path, { force: true }).catch(() =>
          this.logger.error('Не удалось удалить файл после ошибки загрузки'),
        );
      }
      throw error;
    }
  }

  async download(userId: number, fileId: number): Promise<StreamableFile> {
    const file = await this.prisma.$transaction(
      async (tx) => {
        const stored = await tx.storedFile.findUnique({
          where: { id: fileId },
          include: {
            request: {
              select: { houseId: true, authorId: true, visibility: true },
            },
          },
        });
        if (!stored) throw this.notAvailable();
        if (stored.request) {
          const access = await this.requestAccess.getAccess(
            tx,
            userId,
            stored.request,
          );
          if (!access.allowed) throw this.notAvailable();
        } else if (
          stored.ownerId !== userId ||
          !(await this.houseAccess.hasAccess(tx, userId, stored.houseId))
        ) {
          throw this.notAvailable();
        }
        return stored;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );

    const filename = encodeURIComponent(file.originalName).replace(
      /['()*]/g,
      (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    );
    const handle = await open(join(this.directory, file.storageKey), 'r').catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') throw this.notAvailable();
        throw error;
      },
    );
    return new StreamableFile(handle.createReadStream(), {
      type: file.mimeType,
      length: file.size,
      disposition: `attachment; filename="file-${file.id}"; filename*=UTF-8''${filename}`,
    });
  }

  private notAvailable(): NotFoundException {
    return new NotFoundException({
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      code: ErrorCode.FILE_NOT_AVAILABLE,
      message: 'Файл не найден или недоступен',
    });
  }
}
