import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '@common/enums/error-code.enum';
import type { Prisma } from '@generated/prisma/client';
import { HouseMembershipStatus, HouseRole } from '@generated/prisma/enums';

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
      throw this.notAvailable();
    }
  }

  async checkAdminAccess(
    tx: Prisma.TransactionClient,
    userId: number,
    houseId: number,
  ): Promise<void> {
    const membership = await tx.houseMembership.findUnique({
      where: { userId_houseId: { userId, houseId } },
      select: {
        status: true,
        roles: {
          where: { role: HouseRole.house_admin },
          select: { role: true },
        },
      },
    });
    if (membership?.status !== HouseMembershipStatus.approved) {
      throw this.notAvailable();
    }
    if (!membership.roles.length) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        error: 'Forbidden',
        code: ErrorCode.HOUSE_ADMIN_REQUIRED,
        message: 'Нужны права администратора этого дома',
      });
    }
  }

  private notAvailable(): NotFoundException {
    return new NotFoundException({
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      code: ErrorCode.HOUSE_NOT_AVAILABLE,
      message: 'Дом не найден или недоступен',
    });
  }
}
