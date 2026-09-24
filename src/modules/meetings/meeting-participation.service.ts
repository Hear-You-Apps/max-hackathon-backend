import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '@common/enums/error-code.enum';
import { Prisma } from '@generated/prisma/client';
import type { Meeting } from '@generated/prisma/client';
import { HouseMembershipStatus, MeetingFormat } from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';
import { HouseAccessService } from '../houses/services/house-access.service';
import type {
  MeetingParticipationResponseDto,
  UpdateMeetingParticipationDto,
} from './dto/meeting-participation.dto';

@Injectable()
export class MeetingParticipationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly houseAccess: HouseAccessService,
  ) {}

  async update(
    userId: number,
    meetingId: number,
    body: UpdateMeetingParticipationDto,
  ): Promise<MeetingParticipationResponseDto> {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`
          SELECT id FROM users WHERE id = ${userId} FOR UPDATE
        `;
        await tx.$queryRaw`
          SELECT id FROM meetings WHERE id = ${meetingId} FOR UPDATE
        `;
        const meeting = await tx.meeting.findUnique({
          where: { id: meetingId },
          select: {
            houseId: true,
            format: true,
            startsAt: true,
            isCancelled: true,
          },
        });
        if (
          !meeting ||
          !(await this.houseAccess.hasAccess(tx, userId, meeting.houseId))
        ) {
          throw new NotFoundException({
            statusCode: HttpStatus.NOT_FOUND,
            error: 'Not Found',
            code: ErrorCode.MEETING_NOT_AVAILABLE,
            message: 'Собрание не найдено или недоступно',
          });
        }
        this.checkParticipationAvailable(meeting);

        await tx.meetingParticipation.upsert({
          where: { meetingId_userId: { meetingId, userId } },
          create: { meetingId, userId, willAttend: body.willAttend },
          update: { willAttend: body.willAttend },
        });

        const participation = await this.findOne(
          tx,
          userId,
          meetingId,
          meeting.houseId,
        );
        this.checkParticipationAvailable(meeting);
        return participation;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  async findOne(
    tx: Prisma.TransactionClient,
    userId: number,
    meetingId: number,
    houseId: number,
  ): Promise<MeetingParticipationResponseDto> {
    const participation = await tx.meetingParticipation.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
      select: { willAttend: true },
    });
    const goingCount = await tx.meetingParticipation.count({
      where: {
        meetingId,
        willAttend: true,
        user: {
          houseMemberships: {
            some: { houseId, status: HouseMembershipStatus.approved },
          },
        },
      },
    });
    return { willAttend: participation?.willAttend ?? null, goingCount };
  }

  private checkParticipationAvailable(
    meeting: Pick<Meeting, 'format' | 'startsAt' | 'isCancelled'>,
  ): void {
    let message: string;
    if (meeting.isCancelled) message = 'Собрание отменено';
    else if (meeting.format === MeetingFormat.absentee) {
      message = 'На заочное собрание не нужно записываться';
    } else if (meeting.startsAt <= new Date()) {
      message = 'Ответ можно поменять только до начала собрания';
    } else return;

    throw new ConflictException({
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      code: ErrorCode.MEETING_PARTICIPATION_UNAVAILABLE,
      message,
    });
  }
}
