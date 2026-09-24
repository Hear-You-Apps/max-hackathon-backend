import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@common/enums/error-code.enum';
import type { Prisma, ServiceRequest } from '@generated/prisma/client';
import {
  HouseMembershipStatus,
  HouseRole,
  RequestVisibility,
} from '@generated/prisma/enums';

@Injectable()
export class RequestAccessService {
  async getAccess(
    tx: Prisma.TransactionClient,
    userId: number,
    request: Pick<ServiceRequest, 'houseId' | 'authorId' | 'visibility'>,
  ): Promise<{ allowed: boolean; isAdmin: boolean }> {
    const membership = await tx.houseMembership.findUnique({
      where: { userId_houseId: { userId, houseId: request.houseId } },
      select: {
        status: true,
        roles: {
          where: { role: HouseRole.house_admin },
          select: { role: true },
        },
      },
    });
    const approved = membership?.status === HouseMembershipStatus.approved;
    const isAdmin = approved && !!membership.roles.length;
    return {
      isAdmin,
      allowed:
        approved &&
        (isAdmin ||
          request.authorId === userId ||
          request.visibility === RequestVisibility.house),
    };
  }

  notAvailable(): NotFoundException {
    return new NotFoundException({
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      code: ErrorCode.REQUEST_NOT_AVAILABLE,
      message: 'Заявка не найдена или недоступна',
    });
  }
}
