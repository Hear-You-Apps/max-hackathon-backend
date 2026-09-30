import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { ErrorCode } from '@common/enums/error-code.enum';
import { Prisma } from '@generated/prisma/client';
import {
  ApartmentVerificationStatus,
  RequestLocationType,
  RequestStatus,
  RequestVisibility,
} from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';
import { HouseAccessService } from '../houses/services/house-access.service';
import type { CreateRequestDto } from './dto/create-request.dto';
import type { RequestsQueryDto } from './dto/requests-query.dto';
import type {
  RequestDetailsResponseDto,
  RequestsResponseDto,
} from './dto/request.dto';
import {
  RequestsScope,
  RequestsStatusFilter,
} from './enums/requests-query.enum';
import {
  requestDetailsSelect,
  requestSelect,
  toRequestDetailsResponse,
  toRequestResponse,
} from './internal/request.mapper';
import { RequestAccessService } from './request-access.service';

@Injectable()
export class RequestsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly houseAccess: HouseAccessService,
    private readonly requestAccess: RequestAccessService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Старая версия сервера ещё может создать заявку без UUID до выкладки нового кода
    const requests = await this.prisma.serviceRequest.findMany({
      where: { publicId: null },
      select: { id: true },
    });
    for (const request of requests) {
      await this.prisma.serviceRequest.updateMany({
        where: { id: request.id, publicId: null },
        data: { publicId: randomUUID() },
      });
    }
  }

  async create(
    userId: number,
    houseId: number,
    body: CreateRequestDto,
  ): Promise<RequestDetailsResponseDto> {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
        await this.houseAccess.checkAccess(tx, userId, houseId);

        if (body.locationType === RequestLocationType.apartment) {
          if (!body.apartmentId)
            throw this.invalidLocation('Выберите свою квартиру');
          const apartment = await tx.apartmentMembership.findFirst({
            where: {
              apartmentId: body.apartmentId,
              houseId,
              verificationStatus: ApartmentVerificationStatus.verified,
              membership: { userId },
            },
            select: { apartmentId: true },
          });
          if (!apartment) {
            throw new BadRequestException({
              statusCode: HttpStatus.BAD_REQUEST,
              error: 'Bad Request',
              code: ErrorCode.REQUEST_APARTMENT_NOT_AVAILABLE,
              message:
                'Квартира не найдена или не подтверждена за вами в этом доме',
            });
          }
        } else {
          if (body.apartmentId != null)
            throw this.invalidLocation(
              'Квартира указывается только для locationType apartment',
            );
          if (!body.locationText)
            throw this.invalidLocation('Уточните место проблемы');
        }

        const request = await tx.serviceRequest.create({
          data: {
            publicId: randomUUID(),
            houseId,
            authorId: userId,
            title: body.title,
            description: body.description,
            category: body.category,
            locationType: body.locationType,
            apartmentId: body.apartmentId ?? null,
            locationText: body.locationText || null,
            visibility: body.visibility,
            events: { create: { status: RequestStatus.submitted } },
          },
          select: { id: true },
        });
        if (body.attachmentIds.length) {
          const attached = await tx.storedFile.updateMany({
            where: {
              storageKey: { in: body.attachmentIds },
              ownerId: userId,
              houseId,
              requestId: null,
            },
            data: { requestId: request.id },
          });
          if (attached.count !== body.attachmentIds.length) {
            throw new BadRequestException({
              statusCode: HttpStatus.BAD_REQUEST,
              error: 'Bad Request',
              code: ErrorCode.REQUEST_ATTACHMENTS_NOT_AVAILABLE,
              message:
                'Файл недоступен, загружен в другом доме или уже прикреплён к заявке',
            });
          }
        }
        const created = await tx.serviceRequest.findUniqueOrThrow({
          where: { id: request.id },
          select: requestDetailsSelect,
        });
        return toRequestDetailsResponse(created, userId, false, false);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  async findAll(
    userId: number,
    houseId: number,
    query: RequestsQueryDto,
  ): Promise<RequestsResponseDto> {
    return this.prisma.$transaction(
      async (tx) => {
        await this.houseAccess.checkAccess(tx, userId, houseId);
        const where: Prisma.ServiceRequestWhereInput = {
          houseId,
          ...(query.scope === RequestsScope.MINE
            ? { authorId: userId }
            : { visibility: RequestVisibility.house }),
          ...(query.category && { category: query.category }),
          ...(query.status === RequestsStatusFilter.all
            ? {}
            : {
                status:
                  query.status === RequestsStatusFilter.open
                    ? { notIn: [RequestStatus.closed, RequestStatus.cancelled] }
                    : query.status,
              }),
        };
        const requests = await tx.serviceRequest.findMany({
          where,
          select: requestSelect,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        });
        const total = await tx.serviceRequest.count({ where });
        return {
          items: requests.map((request) => toRequestResponse(request, userId)),
          page: query.page,
          limit: query.limit,
          total,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async findOne(
    userId: number,
    requestId: string,
  ): Promise<RequestDetailsResponseDto> {
    return this.prisma.$transaction(
      async (tx) => {
        const request = await tx.serviceRequest.findUnique({
          where: { publicId: requestId },
          select: requestDetailsSelect,
        });
        if (!request) throw this.requestAccess.notAvailable();
        const access = await this.requestAccess.getAccess(tx, userId, request);
        if (!access.allowed) throw this.requestAccess.notAvailable();
        const subscription = await tx.requestSubscription.findUnique({
          where: { requestId_userId: { requestId: request.id, userId } },
          select: { userId: true },
        });
        return toRequestDetailsResponse(
          request,
          userId,
          access.isAdmin,
          !!subscription,
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async subscribe(userId: number, requestId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.findUnique({
        where: { publicId: requestId },
        select: { id: true, houseId: true, authorId: true },
      });
      if (!request) throw this.requestAccess.notAvailable();
      const access = await this.requestAccess.getAccess(tx, userId, request);
      if (!access.allowed) throw this.requestAccess.notAvailable();
      if (request.authorId === userId) {
        throw new ForbiddenException({
          statusCode: HttpStatus.FORBIDDEN,
          error: 'Forbidden',
          code: ErrorCode.REQUEST_SUBSCRIPTION_FORBIDDEN,
          message: 'На свою заявку подписываться не нужно',
        });
      }
      await tx.requestSubscription.createMany({
        data: [{ requestId: request.id, userId }],
        skipDuplicates: true,
      });
    });
  }

  async unsubscribe(userId: number, requestId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.findUnique({
        where: { publicId: requestId },
        select: { id: true, houseId: true },
      });
      if (!request) throw this.requestAccess.notAvailable();
      const access = await this.requestAccess.getAccess(tx, userId, request);
      if (!access.allowed) throw this.requestAccess.notAvailable();
      await tx.requestSubscription.deleteMany({
        where: { requestId: request.id, userId },
      });
    });
  }

  private invalidLocation(message: string): BadRequestException {
    return new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      code: ErrorCode.INVALID_REQUEST_LOCATION,
      message,
    });
  }
}
