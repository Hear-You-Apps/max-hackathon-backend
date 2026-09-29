import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@common/enums/error-code.enum';
import { Prisma } from '@generated/prisma/client';
import { HouseMembershipStatus } from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';
import type { MyHousesResponseDto } from '../dto/my-houses-response.dto';
import type { HouseDetailsResponseDto } from '../dto/house-details-response.dto';
import type { HouseChatsResponseDto } from '../dto/house-chats-response.dto';
import type { HouseEventDto } from '../dto/house-event.dto';
import type { HouseEventsQueryDto } from '../dto/house-events-query.dto';
import type { HouseEventsResponseDto } from '../dto/house-events-response.dto';
import type { SearchHouseResponseDto } from '../dto/search-house-response.dto';
import {
  houseSelect,
  housePreviewSelect,
  joinRequestSelect,
  houseEventSelect,
} from '../internal/house.selects';
import type { HouseEventData } from '../internal/house.selects';
import { checkInvitation } from '../internal/house-invitation.rules';
import { toJoinRequestResponse } from '../internal/house-join-request.mapper';
import { toHouseResponse } from '../internal/house.mapper';
import { isCurrentJoinRequest } from '../internal/house-join-request.rules';
import { HouseEventsPeriod } from '../enums/house-events-period.enum';
import { HouseAccessService } from './house-access.service';

@Injectable()
export class HousesQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly houseAccess: HouseAccessService,
  ) {}

  async findChats(
    userId: number,
    houseId: number,
  ): Promise<HouseChatsResponseDto> {
    return this.prisma.$transaction(
      async (tx) => {
        await this.houseAccess.checkAccess(tx, userId, houseId);

        const items = await tx.houseChat.findMany({
          where: { houseId },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            type: true,
            name: true,
            description: true,
            url: true,
          },
        });
        return { items };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async findEvents(
    userId: number,
    houseId: number,
    query: HouseEventsQueryDto,
  ): Promise<HouseEventsResponseDto> {
    const { page, limit, period } = query;
    return this.prisma.$transaction(
      async (tx) => {
        await this.houseAccess.checkAccess(tx, userId, houseId);

        const where: Prisma.HouseEventWhereInput = {
          houseId,
          ...this.getEventPeriodFilter(period, new Date()),
        };
        const order = period === HouseEventsPeriod.UPCOMING ? 'asc' : 'desc';
        const events = await tx.houseEvent.findMany({
          where,
          select: houseEventSelect,
          orderBy: [{ startsAt: order }, { id: order }],
          skip: (page - 1) * limit,
          take: limit,
        });
        const total = await tx.houseEvent.count({ where });

        return {
          items: events.map((event) => this.toEventResponse(event)),
          page,
          limit,
          total,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async findOne(
    userId: number,
    houseId: number,
  ): Promise<HouseDetailsResponseDto> {
    return this.prisma.$transaction(
      async (tx) => {
        await this.houseAccess.checkAccess(tx, userId, houseId);

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
                ...this.getEventPeriodFilter(HouseEventsPeriod.UPCOMING, now),
              },
              orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
              take: 3,
              select: houseEventSelect,
            },
          },
        });
        if (!house) this.throwHouseNotAvailable();

        const { contacts, events, paymentUrl, ...info } = house;
        return {
          house: toHouseResponse(info),
          contacts,
          utilities: { paymentUrl },
          upcomingEvents: events.map((event) => this.toEventResponse(event)),
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
        house: { select: housePreviewSelect },
      },
    });

    checkInvitation(invitation);

    const { houses, joinRequests } = await this.findMine(
      userId,
      invitation.houseId,
    );
    return {
      house: toHouseResponse(invitation.house),
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
        .map(({ house, ...membership }) => ({
          ...toHouseResponse(house),
          adminContactUrl:
            membership.status === HouseMembershipStatus.approved
              ? house.adminContactUrl
              : null,
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
          },
        })),
      joinRequests: joinRequests
        .filter((request) =>
          isCurrentJoinRequest(
            request,
            membershipsByHouseId.get(request.houseId),
          ),
        )
        .map(toJoinRequestResponse),
    };
  }

  private getEventPeriodFilter(
    period: HouseEventsPeriod,
    now: Date,
  ): Prisma.HouseEventWhereInput {
    if (period === HouseEventsPeriod.UPCOMING) {
      return {
        OR: [{ endsAt: { gt: now } }, { endsAt: null, startsAt: { gte: now } }],
      };
    }
    if (period === HouseEventsPeriod.PAST) {
      return {
        OR: [{ endsAt: { lte: now } }, { endsAt: null, startsAt: { lt: now } }],
      };
    }
    return {};
  }

  private toEventResponse(event: HouseEventData): HouseEventDto {
    return {
      ...event,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt?.toISOString() ?? null,
    };
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
