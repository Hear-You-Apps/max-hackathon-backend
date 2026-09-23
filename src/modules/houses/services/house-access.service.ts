import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@common/enums/error-code.enum';
import type { Prisma } from '@generated/prisma/client';
import { HouseMembershipStatus } from '@generated/prisma/enums';

@Injectable()
export class HouseAccessService {
  async hasAccess(
    tx: Prisma.TransactionClient,
    userId: number,
    houseId: number,
  ): Promise<boolean> {
    const membership = await tx.houseMembership.findUnique({
      where: { userId_houseId: { userId, houseId } },
      select: { status: true },
    });
    return membership?.status === HouseMembershipStatus.approved;
  }

  async checkAccess(
    tx: Prisma.TransactionClient,
    userId: number,
    houseId: number,
  ): Promise<void> {
    if (!(await this.hasAccess(tx, userId, houseId))) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        code: ErrorCode.HOUSE_NOT_AVAILABLE,
        message: 'Дом не найден или недоступен',
      });
    }
  }
}
