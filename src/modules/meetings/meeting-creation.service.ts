import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ErrorCode } from '@common/enums/error-code.enum';
import { Prisma } from '@generated/prisma/client';
import {
  ApartmentRelationship,
  ApartmentVerificationStatus,
  HouseRole,
  MeetingFormat,
  VotingAudience,
} from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';
import { HouseAccessService } from '../houses/services/house-access.service';
import { MaxBotService } from '../max-bot/max-bot.service';
import type { CreateMeetingDto } from './dto/create-meeting.dto';
import type { MeetingDetailsResponseDto } from './dto/meeting-details-response.dto';
import { toMeetingResponse } from './internal/meeting.mapper';

@Injectable()
export class MeetingCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly houseAccess: HouseAccessService,
    private readonly bot: MaxBotService,
  ) {}

  async create(
    userId: number,
    houseId: number,
    body: CreateMeetingDto,
  ): Promise<MeetingDetailsResponseDto> {
    const created = await this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`
          SELECT id FROM users WHERE id = ${userId} FOR UPDATE
        `;
        await this.houseAccess.checkAccess(tx, userId, houseId);
        const house = await tx.house.findUnique({
          where: { id: houseId },
          select: { apartmentsCount: true },
        });
        if (body.participationThresholdPercent && !house?.apartmentsCount) {
          throw new BadRequestException({
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            code: ErrorCode.MEETING_APARTMENTS_COUNT_REQUIRED,
            message: 'Сначала укажите количество квартир в доме',
          });
        }

        const membership = await tx.houseMembership.findUnique({
          where: { userId_houseId: { userId, houseId } },
          select: {
            roles: {
              where: {
                role: {
                  in: [
                    HouseRole.organizer,
                    HouseRole.house_council,
                    HouseRole.house_admin,
                  ],
                },
              },
              select: { role: true },
            },
            apartments: {
              where: {
                relationship: ApartmentRelationship.owner,
                verificationStatus: ApartmentVerificationStatus.verified,
              },
              take: 1,
              select: { apartmentId: true },
            },
          },
        });
        if (!membership?.roles.length && !membership?.apartments.length) {
          throw new ForbiddenException({
            statusCode: HttpStatus.FORBIDDEN,
            error: 'Forbidden',
            code: ErrorCode.MEETING_CREATE_FORBIDDEN,
            message:
              'Создать собрание может собственник, организатор, совет дома или админ',
          });
        }

        if (Boolean(body.question) === Boolean(body.questions)) {
          throw new BadRequestException({
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            code: ErrorCode.INVALID_MEETING_QUESTIONS,
            message: 'Передайте один question или список questions',
          });
        }
        const questions = body.questions ?? [{ title: body.question! }];
        const format = body.format ?? MeetingFormat.absentee;
        const now = new Date();
        const startsAt = body.startsAt ? new Date(body.startsAt) : now;
        const endsAt = new Date(body.endsAt);
        if (
          !Number.isFinite(startsAt.getTime()) ||
          !Number.isFinite(endsAt.getTime()) ||
          (body.startsAt && startsAt <= now) ||
          endsAt <= startsAt ||
          startsAt.getUTCFullYear() > 9999 ||
          endsAt.getUTCFullYear() > 9999
        ) {
          throw new BadRequestException({
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            code: ErrorCode.INVALID_MEETING_DATES,
            message: 'Проверьте даты начала и окончания собрания',
          });
        }
        if (format !== MeetingFormat.absentee && !body.location) {
          throw new BadRequestException({
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            code: ErrorCode.MEETING_LOCATION_REQUIRED,
            message: 'Укажите место проведения собрания',
          });
        }

        const meeting = await tx.meeting.create({
          data: {
            houseId,
            authorId: userId,
            title: body.title ?? questions[0].title.slice(0, 255),
            description: body.description || null,
            format,
            audience: body.audience ?? VotingAudience.owners,
            location: body.location || null,
            startsAt,
            endsAt,
            participationThresholdPercent:
              body.participationThresholdPercent ?? null,
            questions: {
              createMany: {
                data: questions.map((question, index) => ({
                  title: question.title,
                  sortOrder: index,
                })),
              },
            },
          },
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
            questions: {
              orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
              select: { id: true, title: true },
            },
          },
        });
        return {
          ...toMeetingResponse(
            meeting,
            new Date(),
            0,
            0,
            house?.apartmentsCount ?? null,
          ),
          description: meeting.description,
          participation:
            meeting.format === MeetingFormat.absentee
              ? null
              : { willAttend: null, goingCount: 0 },
          author: meeting.author
            ? {
                id: meeting.author.id,
                name: [meeting.author.firstName, meeting.author.lastName]
                  .filter(Boolean)
                  .join(' '),
              }
            : null,
          questions: meeting.questions.map((question) => ({
            ...question,
            myVote: null,
            results: { yes: 0, no: 0, abstain: 0 },
          })),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
    this.bot.notifyMeetingCreated(houseId, created.id, created.title);
    return created;
  }
}
