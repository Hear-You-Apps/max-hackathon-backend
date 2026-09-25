import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@common/enums/error-code.enum';
import { Prisma } from '@generated/prisma/client';
import {
  HouseJoinRequestStatus,
  HouseMembershipStatus,
  RequestStatus,
} from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';
import { HouseAccessService } from '../houses/services/house-access.service';
import { housePreviewSelect } from '../houses/internal/house.selects';
import { isCurrentJoinRequest } from '../houses/internal/house-join-request.rules';
import type { AdminHouseOverviewResponseDto } from './dto/admin-house-overview-response.dto';

const ATTENTION_LIMIT = 5;

@Injectable()
export class AdminHousesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly houseAccess: HouseAccessService,
  ) {}

  async getOverview(
    userId: number,
    houseId: number,
  ): Promise<AdminHouseOverviewResponseDto> {
    return this.prisma.$transaction(
      async (tx) => {
        await this.houseAccess.checkAdminAccess(tx, userId, houseId);
        const now = new Date();
        const newRequestsWhere = { houseId, status: RequestStatus.submitted };
        const [
          house,
          newRequestsCount,
          openRequestsCount,
          residentsCount,
          activeMeetingsCount,
          requests,
          joinRequests,
        ] = await Promise.all([
          tx.house.findUnique({
            where: { id: houseId },
            select: housePreviewSelect,
          }),
          tx.serviceRequest.count({ where: newRequestsWhere }),
          tx.serviceRequest.count({
            where: {
              houseId,
              status: {
                notIn: [RequestStatus.closed, RequestStatus.cancelled],
              },
            },
          }),
          tx.houseMembership.count({
            where: { houseId, status: HouseMembershipStatus.approved },
          }),
          tx.meeting.count({
            where: {
              houseId,
              isCancelled: false,
              startsAt: { lte: now },
              endsAt: { gt: now },
            },
          }),
          tx.serviceRequest.findMany({
            where: newRequestsWhere,
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            take: ATTENTION_LIMIT,
            select: {
              id: true,
              title: true,
              category: true,
              status: true,
              createdAt: true,
            },
          }),
          tx.houseJoinRequest.findMany({
            where: { houseId },
            orderBy: { id: 'desc' },
            distinct: ['userId', 'apartmentNumber'],
            select: {
              id: true,
              apartmentNumber: true,
              displayName: true,
              relationship: true,
              status: true,
              createdAt: true,
              user: {
                select: {
                  houseMemberships: {
                    where: { houseId },
                    select: { status: true, lastLeftAt: true },
                  },
                },
              },
            },
          }),
        ]);
        if (!house) {
          throw new NotFoundException({
            statusCode: HttpStatus.NOT_FOUND,
            error: 'Not Found',
            code: ErrorCode.HOUSE_NOT_AVAILABLE,
            message: 'Дом не найден или недоступен',
          });
        }
        const pendingJoinRequests = joinRequests
          .filter(
            (request) =>
              request.status === HouseJoinRequestStatus.pending &&
              isCurrentJoinRequest(request, request.user.houseMemberships[0]),
          )
          .sort(
            (a, b) =>
              a.createdAt.getTime() - b.createdAt.getTime() || a.id - b.id,
          );

        return {
          house,
          stats: {
            newRequestsCount,
            openRequestsCount,
            pendingJoinRequestsCount: pendingJoinRequests.length,
            residentsCount,
            activeMeetingsCount,
          },
          attention: {
            requests: requests.map((request) => ({
              ...request,
              createdAt: request.createdAt.toISOString(),
            })),
            joinRequests: pendingJoinRequests
              .slice(0, ATTENTION_LIMIT)
              .map((request) => ({
                id: request.id,
                apartmentNumber: request.apartmentNumber,
                displayName: request.displayName,
                relationship: request.relationship,
                createdAt: request.createdAt.toISOString(),
              })),
          },
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }
}
