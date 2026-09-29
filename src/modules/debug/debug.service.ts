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
  HouseRole,
} from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class DebugService {
  constructor(private readonly prisma: PrismaService) {}

  async deleteUser(userId: number): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        const users = await tx.$queryRaw<{ id: number }[]>`
        SELECT id FROM users WHERE id = ${userId} FOR UPDATE
      `;
        if (!users.length) {
          throw new NotFoundException({
            statusCode: HttpStatus.NOT_FOUND,
            error: 'Not Found',
            code: ErrorCode.USER_NOT_FOUND,
            message: 'Пользователь не найден',
          });
        }

        await tx.houseJoinRequest.deleteMany({ where: { userId } });
        await tx.apartmentMembership.deleteMany({
          where: { membership: { userId } },
        });
        await tx.houseMembership.deleteMany({ where: { userId } });
        await tx.user.delete({ where: { id: userId } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  async review(
    requestId: number,
    status: 'approved' | 'rejected',
    reason?: string,
  ): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        const target = await tx.houseJoinRequest.findUnique({
          where: { id: requestId },
          select: { userId: true },
        });
        if (!target) throw this.requestNotFound();

        await tx.$queryRaw`
        SELECT id FROM users WHERE id = ${target.userId} FOR UPDATE
      `;
        const request = await tx.houseJoinRequest.findUnique({
          where: { id: requestId },
        });
        if (!request) throw this.requestNotFound();
        if (request.status !== HouseJoinRequestStatus.pending) {
          throw this.requestNotPending();
        }

        await tx.$queryRaw`
        SELECT id FROM houses WHERE id = ${request.houseId} FOR UPDATE
      `;
        const existing = await tx.houseMembership.findUnique({
          where: {
            userId_houseId: {
              userId: request.userId,
              houseId: request.houseId,
            },
          },
        });
        const newerRequest = await tx.houseJoinRequest.findFirst({
          where: {
            userId: request.userId,
            houseId: request.houseId,
            apartmentNumber: request.apartmentNumber,
            id: { gt: request.id },
          },
          select: { id: true },
        });
        if (
          newerRequest ||
          (existing?.lastLeftAt && request.createdAt <= existing.lastLeftAt) ||
          (existing?.status === HouseMembershipStatus.left &&
            !existing.lastLeftAt)
        ) {
          throw new ConflictException({
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            code: ErrorCode.JOIN_REQUEST_OUTDATED,
            message: 'Заявка устарела. Отправьте новую заявку на присоединение',
          });
        }

        const updated = await tx.houseJoinRequest.updateMany({
          where: { id: requestId, status: HouseJoinRequestStatus.pending },
          data: {
            status,
            rejectionReason: status === 'rejected' ? reason : null,
          },
        });
        if (!updated.count) throw this.requestNotPending();
        if (status === 'rejected') return;

        if (existing && existing.status !== HouseMembershipStatus.approved) {
          await tx.apartmentMembership.deleteMany({
            where: { membershipId: existing.id },
          });
          await tx.houseMemberRole.deleteMany({
            where: { membershipId: existing.id },
          });
        }

        const membershipData = {
          status: HouseMembershipStatus.approved,
          revocationReason: null,
          displayName: request.displayName,
        };
        const membership = await tx.houseMembership.upsert({
          where: {
            userId_houseId: {
              userId: request.userId,
              houseId: request.houseId,
            },
          },
          create: {
            ...membershipData,
            userId: request.userId,
            houseId: request.houseId,
          },
          update: {
            ...membershipData,
            ...(existing?.status === HouseMembershipStatus.approved && {}),
          },
        });
        await tx.houseMemberRole.upsert({
          where: {
            membershipId_role: {
              membershipId: membership.id,
              role: HouseRole.resident,
            },
          },
          create: { membershipId: membership.id, role: HouseRole.resident },
          update: {},
        });
        const apartment = await tx.apartment.upsert({
          where: {
            houseId_number: {
              houseId: request.houseId,
              number: request.apartmentNumber,
            },
          },
          create: { houseId: request.houseId, number: request.apartmentNumber },
          update: {},
        });
        const apartmentData = {
          relationship: request.relationship,
          verificationStatus: ApartmentVerificationStatus.verified,
        };
        await tx.apartmentMembership.upsert({
          where: {
            membershipId_apartmentId: {
              membershipId: membership.id,
              apartmentId: apartment.id,
            },
          },
          create: {
            ...apartmentData,
            membershipId: membership.id,
            apartmentId: apartment.id,
            houseId: request.houseId,
          },
          update: apartmentData,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  private requestNotFound(): NotFoundException {
    return new NotFoundException({
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      code: ErrorCode.JOIN_REQUEST_NOT_FOUND,
      message: 'Заявка на присоединение к дому не найдена',
    });
  }

  private requestNotPending(): ConflictException {
    return new ConflictException({
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      code: ErrorCode.JOIN_REQUEST_NOT_PENDING,
      message: 'Рассмотреть можно только заявку, ожидающую подтверждения',
    });
  }
}
