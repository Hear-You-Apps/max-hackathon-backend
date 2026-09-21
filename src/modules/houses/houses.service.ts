import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import {
  HouseJoinRequestStatus,
  HouseMembershipStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type { MyHousesResponseDto } from './dto/my-houses-response.dto';
import { HousePermission } from './enums/house-permission.enum';

const houseSelect = {
  id: true,
  address: true,
  managementCompanyName: true,
  adminContactUrl: true,
  apartmentsCount: true,
  entrancesCount: true,
} satisfies Prisma.HouseSelect;

const readPermissions = [
  HousePermission.HOUSE_READ,
  HousePermission.MEETINGS_READ,
  HousePermission.REQUESTS_READ,
];

@Injectable()
export class HousesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: number): Promise<MyHousesResponseDto> {
    const [memberships, joinRequests] = await this.prisma.$transaction(
      [
        this.prisma.houseMembership.findMany({
          where: { userId },
          orderBy: { id: 'asc' },
          select: {
            id: true,
            status: true,
            lastLeftAt: true,
            revocationReason: true,
            displayName: true,
            notifyMeetings: true,
            notifyRequests: true,
            house: { select: houseSelect },
            roles: { select: { role: true }, orderBy: { role: 'asc' } },
            apartments: {
              orderBy: { apartmentId: 'asc' },
              select: {
                relationship: true,
                verificationStatus: true,
                apartment: { select: { id: true, number: true } },
              },
            },
          },
        }),
        this.prisma.houseJoinRequest.findMany({
          where: { userId },
          orderBy: { id: 'desc' },
          distinct: ['houseId', 'apartmentNumber'],
          select: {
            id: true,
            houseId: true,
            apartmentNumber: true,
            displayName: true,
            relationship: true,
            status: true,
            createdAt: true,
            rejectionReason: true,
            notifyMeetings: true,
            notifyRequests: true,
            house: { select: houseSelect },
          },
        }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );

    const membershipsByHouseId = new Map(
      memberships.map((membership) => [membership.house.id, membership]),
    );

    return {
      houses: memberships
        .filter(
          (membership) => membership.status !== HouseMembershipStatus.left,
        )
        .map((membership) => ({
          ...membership.house,
          membership: {
            id: membership.id,
            status: membership.status,
            revocationReason: membership.revocationReason,
            displayName: membership.displayName,
            roles:
              membership.status === HouseMembershipStatus.approved
                ? membership.roles.map(({ role }) => role)
                : [],
            apartments: membership.apartments.map(
              ({ apartment, relationship, verificationStatus }) => ({
                ...apartment,
                relationship,
                verificationStatus,
              }),
            ),
            notifications: {
              meetings: membership.notifyMeetings,
              requests: membership.notifyRequests,
            },
          },
          permissions:
            membership.status === HouseMembershipStatus.approved
              ? [...readPermissions]
              : [],
        })),
      joinRequests: joinRequests
        .filter((request) => {
          if (
            request.status !== HouseJoinRequestStatus.pending &&
            request.status !== HouseJoinRequestStatus.rejected
          ) {
            return false;
          }

          const membership = membershipsByHouseId.get(request.houseId);
          if (!membership) return true;
          if (membership.lastLeftAt) {
            return request.createdAt > membership.lastLeftAt;
          }
          return membership.status !== HouseMembershipStatus.left;
        })
        .map((request) => ({
          id: request.id,
          house: request.house,
          apartmentNumber: request.apartmentNumber,
          displayName: request.displayName,
          relationship: request.relationship,
          status: request.status,
          rejectionReason: request.rejectionReason,
          notifications: {
            meetings: request.notifyMeetings,
            requests: request.notifyRequests,
          },
          permissions:
            membershipsByHouseId.get(request.houseId)?.status ===
            HouseMembershipStatus.revoked
              ? []
              : [...readPermissions],
        })),
    };
  }
}
