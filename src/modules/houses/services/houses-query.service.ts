import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@common/enums/error-code.enum';
import { Prisma } from '@generated/prisma/client';
import type {
  HouseJoinRequest,
  HouseMembership,
} from '@generated/prisma/client';
import {
  HouseJoinRequestStatus,
  HouseMembershipStatus,
} from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';
import type { MyHousesResponseDto } from '../dto/my-houses-response.dto';
import type { HouseDetailsResponseDto } from '../dto/house-details-response.dto';
import type { SearchHouseResponseDto } from '../dto/search-house-response.dto';
import { houseSelect, joinRequestSelect } from '../internal/house.selects';
import { readPermissions } from '../internal/house.permissions';
import { checkInvitation } from '../internal/house-invitation.rules';
import { toJoinRequestResponse } from '../internal/house-join-request.mapper';

@Injectable()
export class HousesQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(
    userId: number,
    houseId: number,
  ): Promise<HouseDetailsResponseDto> {
    return this.prisma.$transaction(
      async (tx) => {
        const membership = await tx.houseMembership.findUnique({
          where: { userId_houseId: { userId, houseId } },
          select: { status: true, lastLeftAt: true },
        });
        let canRead = membership?.status === HouseMembershipStatus.approved;

        if (!canRead && membership?.status !== HouseMembershipStatus.revoked) {
          const requests = await tx.houseJoinRequest.findMany({
            where: { userId, houseId },
            orderBy: { id: 'desc' },
            distinct: ['apartmentNumber'],
            select: { apartmentNumber: true, status: true, createdAt: true },
          });
          canRead = requests.some((request) =>
            this.isCurrentJoinRequest(request, membership),
          );
        }

        if (!canRead) this.throwHouseNotAvailable();

        const now = new Date();
        const house = await tx.house.findUnique({
          where: { id: houseId },
          select: {
            ...houseSelect,
            yearBuilt: true,
            paymentUrl: true,
            contacts: {
              orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
              select: {
                id: true,
                type: true,
                name: true,
                phone: true,
                address: true,
                workingHours: true,
                messengerUrl: true,
              },
            },
            events: {
              where: {
                isCancelled: false,
                OR: [
                  { endsAt: { gt: now } },
                  { endsAt: null, startsAt: { gte: now } },
                ],
              },
              orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
              take: 3,
              select: {
                id: true,
                type: true,
                title: true,
                description: true,
                startsAt: true,
                endsAt: true,
                location: true,
                isCancelled: true,
              },
            },
          },
        });
        if (!house) this.throwHouseNotAvailable();

        const { contacts, events, paymentUrl, ...info } = house;
        return {
          house: info,
          contacts,
          utilities: { paymentUrl },
          upcomingEvents: events.map((event) => ({
            ...event,
            startsAt: event.startsAt.toISOString(),
            endsAt: event.endsAt?.toISOString() ?? null,
          })),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async search(userId: number, code: string): Promise<SearchHouseResponseDto> {
    const invitation = await this.prisma.houseInvitation.findUnique({
      where: { code },
      select: {
        houseId: true,
        expiresAt: true,
        revokedAt: true,
        house: {
          select: {
            ...houseSelect,
            _count: {
              select: {
                memberships: {
                  where: { status: HouseMembershipStatus.approved },
                },
              },
            },
          },
        },
      },
    });

    checkInvitation(invitation);

    const { houses, joinRequests } = await this.findMine(
      userId,
      invitation.houseId,
    );
    const { _count, ...house } = invitation.house;
    return {
      house: { ...house, residentsCount: _count.memberships },
      membership: houses[0]?.membership ?? null,
      joinRequest: joinRequests[0] ?? null,
    };
  }

  async findMine(
    userId: number,
    houseId?: number,
  ): Promise<MyHousesResponseDto> {
    const [memberships, joinRequests] = await this.prisma.$transaction(
      [
        this.prisma.houseMembership.findMany({
          where: { userId, houseId },
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
          where: { userId, houseId },
          orderBy: { id: 'desc' },
          distinct: ['houseId', 'apartmentNumber'],
          select: joinRequestSelect,
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
        .filter((request) =>
          this.isCurrentJoinRequest(
            request,
            membershipsByHouseId.get(request.houseId),
          ),
        )
        .map((request) =>
          toJoinRequestResponse(
            request,
            membershipsByHouseId.get(request.houseId)?.status,
          ),
        ),
    };
  }

  private isCurrentJoinRequest(
    request: Pick<HouseJoinRequest, 'status' | 'createdAt'>,
    membership:
      Pick<HouseMembership, 'status' | 'lastLeftAt'> | null | undefined,
  ): boolean {
    if (
      request.status !== HouseJoinRequestStatus.pending &&
      request.status !== HouseJoinRequestStatus.rejected
    ) {
      return false;
    }
    if (!membership) return true;
    if (membership.lastLeftAt) {
      return request.createdAt > membership.lastLeftAt;
    }
    return membership.status !== HouseMembershipStatus.left;
  }

  private throwHouseNotAvailable(): never {
    throw new NotFoundException({
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      code: ErrorCode.HOUSE_NOT_AVAILABLE,
      message: 'Дом не найден или недоступен',
    });
  }
}
