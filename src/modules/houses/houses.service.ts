import {
  ConflictException,
  GoneException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '@common/enums/error-code.enum';
import { Prisma } from '@generated/prisma/client';
import type {
  HouseInvitation,
  HouseJoinRequest,
  HouseMembership,
} from '@generated/prisma/client';
import {
  ApartmentVerificationStatus,
  HouseJoinRequestStatus,
  HouseMembershipStatus,
} from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';
import type {
  HouseNotificationsDto,
  MyHouseJoinRequestDto,
  MyHousesResponseDto,
} from './dto/my-houses-response.dto';
import type { JoinHouseDto } from './dto/join-house.dto';
import type { HouseDetailsResponseDto } from './dto/house-details-response.dto';
import type { SearchHouseResponseDto } from './dto/search-house-response.dto';
import type { UpdateHouseNotificationsDto } from './dto/update-house-notifications.dto';
import { HousePermission } from './enums/house-permission.enum';

const houseSelect = {
  id: true,
  address: true,
  managementCompanyName: true,
  adminContactUrl: true,
  apartmentsCount: true,
  entrancesCount: true,
} satisfies Prisma.HouseSelect;

const joinRequestSelect = {
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
} satisfies Prisma.HouseJoinRequestSelect;

type JoinRequestWithHouse = Prisma.HouseJoinRequestGetPayload<{
  select: typeof joinRequestSelect;
}>;
type InvitationValidity = Pick<HouseInvitation, 'expiresAt' | 'revokedAt'>;

const readPermissions = [
  HousePermission.HOUSE_READ,
  HousePermission.MEETINGS_READ,
  HousePermission.REQUESTS_READ,
];

@Injectable()
export class HousesService {
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

  async leave(userId: number, requestId: number): Promise<void> {
    const result = await this.prisma.houseJoinRequest.updateMany({
      where: { id: requestId, userId, status: HouseJoinRequestStatus.pending },
      data: { status: HouseJoinRequestStatus.cancelled },
    });
    if (result.count > 0) return;

    const request = await this.prisma.houseJoinRequest.findFirst({
      where: { id: requestId, userId },
      select: { id: true },
    });
    if (!request) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        code: ErrorCode.JOIN_REQUEST_NOT_FOUND,
        message: 'Заявка на присоединение к дому не найдена',
      });
    }

    throw new ConflictException({
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      code: ErrorCode.JOIN_REQUEST_NOT_PENDING,
      message: 'Отменить можно только заявку, ожидающую подтверждения',
    });
  }

  async join(
    userId: number,
    body: JoinHouseDto,
  ): Promise<MyHouseJoinRequestDto> {
    return this.prisma.$transaction(
      async (tx) => {
        const users = await tx.$queryRaw<{ id: number }[]>`
        SELECT id FROM users WHERE id = ${userId} FOR UPDATE
      `;
        if (!users.length) {
          throw new ConflictException({
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            code: ErrorCode.USER_NOT_INITIALIZED,
            message: 'Сначала выполните инициализацию пользователя',
          });
        }

        await tx.$queryRaw`
        SELECT id FROM house_invitations WHERE code = ${body.code} FOR UPDATE
      `;
        const invitation = await tx.houseInvitation.findUnique({
          where: { code: body.code },
        });
        this.checkInvitation(invitation);

        await tx.$queryRaw`
        SELECT id FROM house_memberships
        WHERE user_id = ${userId} AND house_id = ${invitation.houseId} FOR UPDATE
      `;
        const membership = await tx.houseMembership.findUnique({
          where: { userId_houseId: { userId, houseId: invitation.houseId } },
          select: { id: true, status: true, lastLeftAt: true },
        });

        if (
          membership?.status === HouseMembershipStatus.left &&
          !membership.lastLeftAt
        ) {
          throw new ConflictException({
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            code: ErrorCode.HOUSE_REJOIN_UNAVAILABLE,
            message:
              'Не определена дата выхода из дома. Обратитесь к администратору',
          });
        }

        if (membership?.status === HouseMembershipStatus.approved) {
          const apartment = await tx.apartmentMembership.findFirst({
            where: {
              membershipId: membership.id,
              apartment: { number: body.apartmentNumber },
              verificationStatus: { not: ApartmentVerificationStatus.rejected },
            },
            select: { apartmentId: true },
          });
          if (apartment) {
            throw new ConflictException({
              statusCode: HttpStatus.CONFLICT,
              error: 'Conflict',
              code: ErrorCode.APARTMENT_ALREADY_LINKED,
              message: 'Эта квартира уже привязана к вашему аккаунту',
            });
          }
        }

        const pendingRequest = await tx.houseJoinRequest.findFirst({
          where: {
            userId,
            houseId: invitation.houseId,
            apartmentNumber: body.apartmentNumber,
            status: HouseJoinRequestStatus.pending,
            ...(membership?.lastLeftAt && {
              createdAt: { gt: membership.lastLeftAt },
            }),
          },
          select: { id: true },
        });
        if (pendingRequest) {
          throw new ConflictException({
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            code: ErrorCode.JOIN_REQUEST_ALREADY_EXISTS,
            message: 'Заявка на эту квартиру уже ожидает подтверждения',
          });
        }

        this.checkInvitation(invitation);
        const createdAt = new Date();
        if (membership?.lastLeftAt && createdAt <= membership.lastLeftAt) {
          throw new ConflictException({
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            code: ErrorCode.HOUSE_REJOIN_UNAVAILABLE,
            message:
              'Дата выхода из дома ещё не прошла. Повторите запрос позже',
          });
        }
        const request = await tx.houseJoinRequest.create({
          data: {
            userId,
            houseId: invitation.houseId,
            apartmentNumber: body.apartmentNumber,
            displayName: body.displayName,
            relationship: body.relationship,
            status: HouseJoinRequestStatus.pending,
            createdAt,
            notifyMeetings: body.notifications.meetings,
            notifyRequests: body.notifications.requests,
          },
          select: joinRequestSelect,
        });

        return this.toJoinRequestResponse(request, membership?.status);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
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

    this.checkInvitation(invitation);

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
          this.toJoinRequestResponse(
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

  private toJoinRequestResponse(
    request: JoinRequestWithHouse,
    membershipStatus?: HouseMembershipStatus,
  ): MyHouseJoinRequestDto {
    return {
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
        membershipStatus === HouseMembershipStatus.revoked
          ? []
          : [...readPermissions],
    };
  }

  private checkInvitation(
    invitation: InvitationValidity | null,
  ): asserts invitation is InvitationValidity {
    if (!invitation) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        code: ErrorCode.INVITATION_NOT_FOUND,
        message: 'Дом с таким кодом приглашения не найден',
      });
    }
    if (invitation.revokedAt) {
      throw new GoneException({
        statusCode: HttpStatus.GONE,
        error: 'Gone',
        code: ErrorCode.INVITATION_REVOKED,
        message:
          'Приглашение отозвано. Запросите новый код у администратора дома',
      });
    }
    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw new GoneException({
        statusCode: HttpStatus.GONE,
        error: 'Gone',
        code: ErrorCode.INVITATION_EXPIRED,
        message:
          'Срок действия приглашения истёк. Запросите новый код у администратора дома',
      });
    }
  }
}
