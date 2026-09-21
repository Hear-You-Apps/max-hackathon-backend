import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@common/enums/error-code.enum';
import { Prisma } from '@generated/prisma/client';
import {
  HouseJoinRequestStatus,
  HouseMembershipStatus,
} from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';
import type { HouseNotificationsDto } from '../dto/my-houses-response.dto';
import type { UpdateHouseNotificationsDto } from '../dto/update-house-notifications.dto';

@Injectable()
export class HouseMembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async updateNotifications(
    userId: number,
    body: UpdateHouseNotificationsDto,
  ): Promise<HouseNotificationsDto> {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`
          SELECT id FROM users WHERE id = ${userId} FOR UPDATE
        `;
        const result = await tx.houseMembership.updateMany({
          where: {
            userId,
            houseId: body.houseId,
            status: HouseMembershipStatus.approved,
          },
          data: {
            notifyMeetings: body.notifications.meetings,
            notifyRequests: body.notifications.requests,
          },
        });
        if (!result.count) {
          throw new NotFoundException({
            statusCode: HttpStatus.NOT_FOUND,
            error: 'Not Found',
            code: ErrorCode.HOUSE_MEMBERSHIP_NOT_FOUND,
            message: 'Нет подтверждённого членства в этом доме',
          });
        }
        return {
          meetings: body.notifications.meetings,
          requests: body.notifications.requests,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  async leaveMembership(userId: number, houseId: number): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`
          SELECT id FROM users WHERE id = ${userId} FOR UPDATE
        `;
        const membership = await tx.houseMembership.findUnique({
          where: { userId_houseId: { userId, houseId } },
          select: { id: true, status: true },
        });
        if (!membership) {
          throw new NotFoundException({
            statusCode: HttpStatus.NOT_FOUND,
            error: 'Not Found',
            code: ErrorCode.HOUSE_MEMBERSHIP_NOT_FOUND,
            message: 'Вы не состоите в этом доме',
          });
        }
        if (membership.status === HouseMembershipStatus.left) return;

        await tx.houseMembership.update({
          where: { id: membership.id },
          data: {
            status: HouseMembershipStatus.left,
            lastLeftAt: new Date(),
            notifyMeetings: false,
            notifyRequests: false,
          },
        });
        await tx.houseJoinRequest.updateMany({
          where: { userId, houseId, status: HouseJoinRequestStatus.pending },
          data: { status: HouseJoinRequestStatus.cancelled },
        });
        await tx.houseJoinRequest.updateMany({
          where: { userId, houseId },
          data: { notifyMeetings: false, notifyRequests: false },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }
}
