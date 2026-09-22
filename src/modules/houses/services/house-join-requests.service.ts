import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '@common/enums/error-code.enum';
import { Prisma } from '@generated/prisma/client';
import {
  ApartmentVerificationStatus,
  HouseJoinRequestStatus,
  HouseMembershipStatus,
} from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';
import type { MyHouseJoinRequestDto } from '../dto/my-houses-response.dto';
import type { JoinHouseDto } from '../dto/join-house.dto';
import { joinRequestSelect } from '../internal/house.selects';
import { checkInvitation } from '../internal/house-invitation.rules';
import { toJoinRequestResponse } from '../internal/house-join-request.mapper';

@Injectable()
export class HouseJoinRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async join(
    userId: number,
    body: JoinHouseDto,
  ): Promise<MyHouseJoinRequestDto> {
    return this.prisma.$transaction(
      async (tx) => {
        const users = await tx.$queryRaw<{ id: number }[]>`
        SELECT id FROM users WHERE id = ${userId} FOR UPDATE
      `;
        if (!users.length) {
          throw new ConflictException({
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            code: ErrorCode.USER_NOT_INITIALIZED,
            message: 'Сначала выполните инициализацию пользователя',
          });
        }

        await tx.$queryRaw`
        SELECT id FROM house_invitations WHERE code = ${body.code} FOR UPDATE
      `;
        const invitation = await tx.houseInvitation.findUnique({
          where: { code: body.code },
        });
        checkInvitation(invitation);

        await tx.$queryRaw`
        SELECT id FROM house_memberships
        WHERE user_id = ${userId} AND house_id = ${invitation.houseId} FOR UPDATE
      `;
        const membership = await tx.houseMembership.findUnique({
          where: { userId_houseId: { userId, houseId: invitation.houseId } },
          select: { id: true, status: true, lastLeftAt: true },
        });

        if (
          membership?.status === HouseMembershipStatus.left &&
          !membership.lastLeftAt
        ) {
          throw new ConflictException({
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            code: ErrorCode.HOUSE_REJOIN_UNAVAILABLE,
            message:
              'Не определена дата выхода из дома. Обратитесь к администратору',
          });
        }

        if (membership?.status === HouseMembershipStatus.approved) {
          const apartment = await tx.apartmentMembership.findFirst({
            where: {
              membershipId: membership.id,
              apartment: { number: body.apartmentNumber },
              verificationStatus: { not: ApartmentVerificationStatus.rejected },
            },
            select: { apartmentId: true },
          });
          if (apartment) {
            throw new ConflictException({
              statusCode: HttpStatus.CONFLICT,
              error: 'Conflict',
              code: ErrorCode.APARTMENT_ALREADY_LINKED,
              message: 'Эта квартира уже привязана к вашему аккаунту',
            });
          }
        }

        const pendingRequest = await tx.houseJoinRequest.findFirst({
          where: {
            userId,
            houseId: invitation.houseId,
            apartmentNumber: body.apartmentNumber,
            status: HouseJoinRequestStatus.pending,
            ...(membership?.lastLeftAt && {
              createdAt: { gt: membership.lastLeftAt },
            }),
          },
          select: { id: true },
        });
        if (pendingRequest) {
          throw new ConflictException({
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            code: ErrorCode.JOIN_REQUEST_ALREADY_EXISTS,
            message: 'Заявка на эту квартиру уже ожидает подтверждения',
          });
        }

        checkInvitation(invitation);
        const createdAt = new Date();
        if (membership?.lastLeftAt && createdAt <= membership.lastLeftAt) {
          throw new ConflictException({
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            code: ErrorCode.HOUSE_REJOIN_UNAVAILABLE,
            message:
              'Дата выхода из дома ещё не прошла. Повторите запрос позже',
          });
        }
        const request = await tx.houseJoinRequest.create({
          data: {
            userId,
            houseId: invitation.houseId,
            apartmentNumber: body.apartmentNumber,
            displayName: body.displayName,
            relationship: body.relationship,
            status: HouseJoinRequestStatus.pending,
            createdAt,
            notifyMeetings: body.notifications.meetings,
            notifyRequests: body.notifications.requests,
          },
          select: joinRequestSelect,
        });

        return toJoinRequestResponse(request);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  async cancelJoinRequest(userId: number, requestId: number): Promise<void> {
    const result = await this.prisma.houseJoinRequest.updateMany({
      where: { id: requestId, userId, status: HouseJoinRequestStatus.pending },
      data: { status: HouseJoinRequestStatus.cancelled },
    });
    if (result.count > 0) return;

    const request = await this.prisma.houseJoinRequest.findFirst({
      where: { id: requestId, userId },
      select: { id: true },
    });
    if (!request) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        code: ErrorCode.JOIN_REQUEST_NOT_FOUND,
        message: 'Заявка на присоединение к дому не найдена',
      });
    }

    throw new ConflictException({
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      code: ErrorCode.JOIN_REQUEST_NOT_PENDING,
      message: 'Отменить можно только заявку, ожидающую подтверждения',
    });
  }
}
