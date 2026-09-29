import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '@common/enums/error-code.enum';
import { Prisma } from '@generated/prisma/client';
import type { Meeting } from '@generated/prisma/client';
import {
  ApartmentRelationship,
  ApartmentVerificationStatus,
  MeetingFormat,
  MeetingVoteChoice,
  VotingAudience,
} from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';
import { HouseAccessService } from '../houses/services/house-access.service';
import type {
  MeetingVotesResponseDto,
  UpdateMeetingVotesDto,
} from './dto/meeting-votes.dto';

@Injectable()
export class MeetingVotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly houseAccess: HouseAccessService,
  ) {}

  async update(
    userId: number,
    meetingId: number,
    body: UpdateMeetingVotesDto,
  ): Promise<MeetingVotesResponseDto> {
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
            audience: true,
            startsAt: true,
            endsAt: true,
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

        const apartment = await tx.apartmentMembership.findFirst({
          where: {
            houseId: meeting.houseId,
            membership: { userId },
            verificationStatus: ApartmentVerificationStatus.verified,
            ...(meeting.audience === VotingAudience.owners
              ? { relationship: ApartmentRelationship.owner }
              : {}),
          },
          select: { apartmentId: true },
        });
        if (!apartment) {
          throw new ForbiddenException({
            statusCode: HttpStatus.FORBIDDEN,
            error: 'Forbidden',
            code: ErrorCode.MEETING_VOTE_FORBIDDEN,
            message:
              meeting.audience === VotingAudience.owners
                ? 'Голосовать могут только подтверждённые собственники'
                : 'Голосовать могут только подтверждённые жители',
          });
        }

        this.checkVotingAvailable(meeting);

        const questionIds = body.votes.map((vote) => vote.questionId);
        const questionsCount = await tx.meetingQuestion.count({
          where: { meetingId, id: { in: questionIds } },
        });
        if (questionsCount !== questionIds.length) {
          throw new BadRequestException({
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            code: ErrorCode.INVALID_MEETING_QUESTIONS,
            message: 'Один из вопросов не относится к этому собранию',
          });
        }

        await tx.meetingVote.createMany({
          data: body.votes.map((vote) => ({ ...vote, userId })),
          skipDuplicates: true,
        });
        for (const choice of Object.values(MeetingVoteChoice)) {
          const ids = body.votes
            .filter((vote) => vote.choice === choice)
            .map((vote) => vote.questionId);
          if (!ids.length) continue;

          await tx.meetingVote.updateMany({
            where: { userId, questionId: { in: ids } },
            data: { choice },
          });
        }

        const votes = await tx.meetingVote.findMany({
          where: { userId, question: { meetingId } },
          orderBy: [{ question: { sortOrder: 'asc' } }, { questionId: 'asc' }],
          select: { questionId: true, choice: true },
        });
        this.checkVotingAvailable(meeting);
        return { votes };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  private checkVotingAvailable(
    meeting: Pick<Meeting, 'format' | 'startsAt' | 'endsAt' | 'isCancelled'>,
  ): void {
    const now = new Date();
    let message: string;
    if (meeting.isCancelled) message = 'Собрание отменено';
    else if (meeting.format === MeetingFormat.in_person) {
      message = 'На очном собрании нельзя голосовать онлайн';
    } else if (meeting.startsAt > now) message = 'Голосование ещё не началось';
    else if (meeting.endsAt <= now) message = 'Голосование уже закончилось';
    else return;

    throw new ConflictException({
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      code: ErrorCode.MEETING_VOTING_UNAVAILABLE,
      message,
    });
  }
}
