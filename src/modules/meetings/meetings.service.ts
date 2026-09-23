import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@common/enums/error-code.enum';
import { Prisma } from '@generated/prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { HouseAccessService } from '../houses/services/house-access.service';
import type { MeetingDetailsResponseDto } from './dto/meeting-details-response.dto';
import type { MeetingDto, MeetingQuestionDto } from './dto/meeting.dto';
import type { MeetingsQueryDto } from './dto/meetings-query.dto';
import type { MeetingsResponseDto } from './dto/meetings-response.dto';
import { MeetingStatus } from './enums/meeting-status.enum';
import { MeetingsPeriod } from './enums/meetings-period.enum';

const meetingSelect = {
  id: true,
  houseId: true,
  title: true,
  format: true,
  location: true,
  startsAt: true,
  endsAt: true,
  isCancelled: true,
} satisfies Prisma.MeetingSelect;

const questionSelect = {
  id: true,
  title: true,
} satisfies Prisma.MeetingQuestionSelect;

type MeetingData = Prisma.MeetingGetPayload<{ select: typeof meetingSelect }>;
type QuestionData = Prisma.MeetingQuestionGetPayload<{
  select: typeof questionSelect;
}>;

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly houseAccess: HouseAccessService,
  ) {}

  async findAll(
    userId: number,
    houseId: number,
    query: MeetingsQueryDto,
  ): Promise<MeetingsResponseDto> {
    const { page, limit, period } = query;
    return this.prisma.$transaction(
      async (tx) => {
        await this.houseAccess.checkAccess(tx, userId, houseId);

        const now = new Date();
        const where: Prisma.MeetingWhereInput = {
          houseId,
          ...(period === MeetingsPeriod.ACTUAL
            ? { isCancelled: false, endsAt: { gt: now } }
            : { OR: [{ isCancelled: true }, { endsAt: { lte: now } }] }),
        };
        const meetings = await tx.meeting.findMany({
          where,
          select: {
            ...meetingSelect,
            _count: { select: { questions: true } },
            questions: {
              orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
              take: 1,
              select: questionSelect,
            },
          },
          orderBy:
            period === MeetingsPeriod.ACTUAL
              ? [{ startsAt: 'asc' }, { id: 'asc' }]
              : [{ endsAt: 'desc' }, { id: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
        });
        const total = await tx.meeting.count({ where });
        const questions = await this.getQuestions(
          tx,
          userId,
          meetings.flatMap((meeting) => meeting.questions),
        );
        const questionsById = new Map(
          questions.map((question) => [question.id, question]),
        );
        const participants = await this.countParticipants(
          tx,
          meetings.map((meeting) => meeting.id),
        );
        const items = meetings.map((meeting) => ({
          ...this.toMeetingResponse(
            meeting,
            now,
            participants.get(meeting.id) ?? 0,
          ),
          questionsCount: meeting._count.questions,
          firstQuestion: questionsById.get(meeting.questions[0]?.id) ?? null,
        }));

        return { items, page, limit, total };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async findOne(
    userId: number,
    meetingId: number,
  ): Promise<MeetingDetailsResponseDto> {
    return this.prisma.$transaction(
      async (tx) => {
        const meeting = await tx.meeting.findUnique({
          where: { id: meetingId },
          select: {
            ...meetingSelect,
            description: true,
            author: { select: { id: true, firstName: true, lastName: true } },
            questions: {
              orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
              select: questionSelect,
            },
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

        const now = new Date();
        const questions = await this.getQuestions(
          tx,
          userId,
          meeting.questions,
        );
        const participants = await this.countParticipants(tx, [meeting.id]);
        return {
          ...this.toMeetingResponse(
            meeting,
            now,
            participants.get(meeting.id) ?? 0,
          ),
          description: meeting.description,
          author: meeting.author
            ? {
                id: meeting.author.id,
                name: [meeting.author.firstName, meeting.author.lastName]
                  .filter(Boolean)
                  .join(' '),
              }
            : null,
          questions,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  private async getQuestions(
    tx: Prisma.TransactionClient,
    userId: number,
    questions: QuestionData[],
  ): Promise<MeetingQuestionDto[]> {
    if (!questions.length) return [];

    const questionIds = questions.map((question) => question.id);
    const counts = await tx.meetingVote.groupBy({
      by: ['questionId', 'choice'],
      where: { questionId: { in: questionIds } },
      _count: { _all: true },
    });
    const votes = await tx.meetingVote.findMany({
      where: { userId, questionId: { in: questionIds } },
      select: { questionId: true, choice: true },
    });
    const myVotes = new Map(
      votes.map((vote) => [vote.questionId, vote.choice]),
    );
    const results = new Map(
      questions.map((question) => [
        question.id,
        { for: 0, against: 0, abstain: 0 },
      ]),
    );
    for (const count of counts) {
      results.get(count.questionId)![count.choice] = count._count._all;
    }

    return questions.map((question) => ({
      ...question,
      myVote: myVotes.get(question.id) ?? null,
      results: results.get(question.id)!,
    }));
  }

  private async countParticipants(
    tx: Prisma.TransactionClient,
    meetingIds: number[],
  ): Promise<Map<number, number>> {
    if (!meetingIds.length) return new Map();

    const counts = await tx.$queryRaw<
      {
        meetingId: number;
        participantsCount: bigint;
      }[]
    >`
      SELECT q.meeting_id AS meetingId, COUNT(DISTINCT v.user_id)  AS participantsCount
      FROM meeting_questions q
      JOIN meeting_votes v ON v.question_id = q.id
      WHERE q.meeting_id IN (${Prisma.join(meetingIds)})
      GROUP BY q.meeting_id
    `;
    return new Map(
      counts.map((count) => [count.meetingId, Number(count.participantsCount)]),
    );
  }

  private toMeetingResponse(
    meeting: MeetingData,
    now: Date,
    participantsCount: number,
  ): MeetingDto {
    let status: MeetingStatus;
    if (meeting.isCancelled) status = MeetingStatus.CANCELLED;
    else if (meeting.endsAt <= now) status = MeetingStatus.CLOSED;
    else if (meeting.startsAt > now) status = MeetingStatus.SCHEDULED;
    else status = MeetingStatus.ACTIVE;

    return {
      id: meeting.id,
      houseId: meeting.houseId,
      title: meeting.title,
      format: meeting.format,
      location: meeting.location,
      status,
      startsAt: meeting.startsAt.toISOString(),
      endsAt: meeting.endsAt.toISOString(),
      participantsCount,
    };
  }
}
