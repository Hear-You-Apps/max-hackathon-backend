import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@common/enums/error-code.enum';
import { Prisma } from '@generated/prisma/client';
import {
  HouseJoinRequestStatus,
  HouseMembershipStatus,
} from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class HouseMembershipsService {
  constructor(private readonly prisma: PrismaService) {}

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
          },
        });
        await tx.houseJoinRequest.updateMany({
          where: { userId, houseId, status: HouseJoinRequestStatus.pending },
          data: { status: HouseJoinRequestStatus.cancelled },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }
}
