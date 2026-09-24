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
} from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';
import { HouseAccessService } from '../houses/services/house-access.service';
import type { CreateMeetingDto } from './dto/create-meeting.dto';
import type { MeetingDetailsResponseDto } from './dto/meeting-details-response.dto';
import { toMeetingResponse } from './internal/meeting.mapper';

@Injectable()
export class MeetingCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly houseAccess: HouseAccessService,
  ) {}

  async create(
    userId: number,
    houseId: number,
    body: CreateMeetingDto,
  ): Promise<MeetingDetailsResponseDto> {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`
          SELECT id FROM users WHERE id = ${userId} FOR UPDATE
        `;
        await this.houseAccess.checkAccess(tx, userId, houseId);

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

        const startsAt = new Date(body.startsAt);
        const endsAt = new Date(body.endsAt);
        if (
          !Number.isFinite(startsAt.getTime()) ||
          !Number.isFinite(endsAt.getTime()) ||
          startsAt <= new Date() ||
          endsAt <= startsAt ||
          endsAt.getUTCFullYear() > 9999
        ) {
          throw new BadRequestException({
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            code: ErrorCode.INVALID_MEETING_DATES,
            message:
              'Начало должно быть в будущем, окончание позже начала. Проверьте даты',
          });
        }
        if (body.format !== MeetingFormat.absentee && !body.location) {
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
            title: body.title,
            description: body.description || null,
            format: body.format,
            location: body.location || null,
            startsAt,
            endsAt,
            questions: {
              createMany: {
                data: body.questions.map((question, index) => ({
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
          ...toMeetingResponse(meeting, new Date(), 0),
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
  }
}
