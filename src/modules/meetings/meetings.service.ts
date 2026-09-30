import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MYSQL_UNSIGNED_INT_MAX } from '@common/constants/database.constants';
import { ErrorCode } from '@common/enums/error-code.enum';
import { Prisma } from '@generated/prisma/client';
import { MeetingFormat } from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';
import { HouseAccessService } from '../houses/services/house-access.service';
import { pollSelect, PollsService } from '../polls/polls.service';
import type { PollDto } from '../polls/dto/poll.dto';
import type { MeetingDetailsResponseDto } from './dto/meeting-details-response.dto';
import type { MeetingListItemDto, MeetingQuestionDto } from './dto/meeting.dto';
import type { MeetingsQueryDto } from './dto/meetings-query.dto';
import type { MeetingsResponseDto } from './dto/meetings-response.dto';
import { MeetingsPeriod } from './enums/meetings-period.enum';
import { toMeetingResponse } from './internal/meeting.mapper';
import { MeetingParticipationService } from './meeting-participation.service';

const meetingSelect = {
  id: true,
  houseId: true,
  title: true,
  format: true,
  audience: true,
  location: true,
  startsAt: true,
  endsAt: true,
  isCancelled: true,
  participationThresholdPercent: true,
} satisfies Prisma.MeetingSelect;

const questionSelect = {
  id: true,
  title: true,
} satisfies Prisma.MeetingQuestionSelect;

type QuestionData = Prisma.MeetingQuestionGetPayload<{
  select: typeof questionSelect;
}>;

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly houseAccess: HouseAccessService,
    private readonly participation: MeetingParticipationService,
    private readonly polls: PollsService,
  ) {}

  findItem(
    userId: number,
    itemId: string,
  ): Promise<MeetingDetailsResponseDto | PollDto> {
    const [type, rawId] = itemId.split('_');
    const id = Number(rawId);
    if (id > MYSQL_UNSIGNED_INT_MAX) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'ID выходит за допустимый диапазон',
      });
    }
    return type === 'meeting'
      ? this.findOne(userId, id)
      : this.polls.findOne(userId, id);
  }

  async findAll(
    userId: number,
    houseId: number,
    query: MeetingsQueryDto,
  ): Promise<MeetingsResponseDto> {
    const { page, limit, period } = query;
    return this.prisma.$transaction(
      async (tx) => {
        await this.houseAccess.checkAccess(tx, userId, houseId);
        const house = await tx.house.findUnique({
          where: { id: houseId },
          select: { apartmentsCount: true },
        });

        const now = new Date();
        const meetingWhere: Prisma.MeetingWhereInput = {
          houseId,
          ...(period === MeetingsPeriod.ACTUAL
            ? { isCancelled: false, endsAt: { gt: now } }
            : { OR: [{ isCancelled: true }, { endsAt: { lte: now } }] }),
        };
        const pollWhere: Prisma.PollWhereInput = {
          houseId,
          endsAt: period === MeetingsPeriod.ACTUAL ? { gt: now } : { lte: now },
        };
        const skip = (page - 1) * limit;
        const rows = await tx.$queryRaw<{ kind: string; id: bigint }[]>(
          period === MeetingsPeriod.ACTUAL
            ? Prisma.sql`
                SELECT kind, id FROM (
                  SELECT 'meeting' AS kind, id, starts_at AS sortAt
                  FROM meetings
                  WHERE house_id = ${houseId} AND is_cancelled = false AND ends_at > ${now}
                  UNION ALL
                  SELECT 'poll' AS kind, id, created_at AS sortAt
                  FROM polls
                  WHERE house_id = ${houseId} AND ends_at > ${now}
                ) feed
                ORDER BY sortAt ASC, kind ASC, id ASC
                LIMIT ${limit} OFFSET ${skip}
              `
            : Prisma.sql`
                SELECT kind, id FROM (
                  SELECT 'meeting' AS kind, id, ends_at AS sortAt
                  FROM meetings
                  WHERE house_id = ${houseId} AND (is_cancelled = true OR ends_at <= ${now})
                  UNION ALL
                  SELECT 'poll' AS kind, id, ends_at AS sortAt
                  FROM polls
                  WHERE house_id = ${houseId} AND ends_at <= ${now}
                ) feed
                ORDER BY sortAt DESC, kind ASC, id DESC
                LIMIT ${limit} OFFSET ${skip}
              `,
        );
        const meetingIds = rows
          .filter((row) => row.kind === 'meeting')
          .map((row) => Number(row.id));
        const pollIds = rows
          .filter((row) => row.kind === 'poll')
          .map((row) => Number(row.id));
        const meetings = await tx.meeting.findMany({
          where: { id: { in: meetingIds } },
          select: {
            ...meetingSelect,
            _count: { select: { questions: true } },
            questions: {
              orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
              take: 1,
              select: questionSelect,
            },
          },
        });
        const polls = await tx.poll.findMany({
          where: { id: { in: pollIds } },
          select: pollSelect,
        });
        const total =
          (await tx.meeting.count({ where: meetingWhere })) +
          (await tx.poll.count({ where: pollWhere }));
        const questions = await this.getQuestions(
          tx,
          userId,
          meetings.flatMap((meeting) => meeting.questions),
        );
        const questionsById = new Map(
          questions.map((question) => [question.id, question]),
        );
        const participation = await this.countParticipants(
          tx,
          meetings.map((meeting) => meeting.id),
        );
        const meetingItems = new Map<number, MeetingListItemDto>(
          meetings.map((meeting) => [
            meeting.id,
            {
              ...toMeetingResponse(
                meeting,
                now,
                participation.get(meeting.id)?.users ?? 0,
                participation.get(meeting.id)?.apartments ?? 0,
                house?.apartmentsCount ?? null,
              ),
              type: 'meeting',
              questionsCount: meeting._count.questions,
              firstQuestion:
                questionsById.get(meeting.questions[0]?.id) ?? null,
            },
          ]),
        );
        const pollItems = await this.polls.toDtos(tx, polls, userId, now);
        const items = rows.flatMap((row) => {
          const id = Number(row.id);
          const item =
            row.kind === 'meeting' ? meetingItems.get(id) : pollItems.get(id);
          return item ? [item] : [];
        });

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
        const house = await tx.house.findUnique({
          where: { id: meeting.houseId },
          select: { apartmentsCount: true },
        });
        const questions = await this.getQuestions(
          tx,
          userId,
          meeting.questions,
        );
        const participationCounts = await this.countParticipants(tx, [
          meeting.id,
        ]);
        const participation =
          meeting.format === MeetingFormat.absentee
            ? null
            : await this.participation.findOne(
                tx,
                userId,
                meeting.id,
                meeting.houseId,
              );
        return {
          type: 'meeting' as const,
          ...toMeetingResponse(
            meeting,
            now,
            participationCounts.get(meeting.id)?.users ?? 0,
            participationCounts.get(meeting.id)?.apartments ?? 0,
            house?.apartmentsCount ?? null,
          ),
          description: meeting.description,
          participation,
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
      questions.map((question) => [question.id, { yes: 0, no: 0, abstain: 0 }]),
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
  ): Promise<Map<number, { users: number; apartments: number }>> {
    if (!meetingIds.length) return new Map();

    const userCounts = await tx.$queryRaw<
      {
        meetingId: bigint;
        participantsCount: bigint;
      }[]
    >`
      SELECT q.meeting_id AS meetingId, COUNT(DISTINCT v.user_id) AS participantsCount
      FROM meeting_questions q
      JOIN meeting_votes v ON v.question_id = q.id
      WHERE q.meeting_id IN (${Prisma.join(meetingIds)})
      GROUP BY q.meeting_id
    `;
    const apartmentCounts = await tx.$queryRaw<
      { meetingId: bigint; apartmentsCount: bigint }[]
    >`
      SELECT activity.meetingId, COUNT(DISTINCT activity.apartmentId) AS apartmentsCount
      FROM (
        SELECT q.meeting_id AS meetingId, am.apartment_id AS apartmentId
        FROM meeting_questions q
        JOIN meeting_votes v ON v.question_id = q.id
        JOIN meetings m ON m.id = q.meeting_id
        JOIN house_memberships hm ON hm.user_id = v.user_id
          AND hm.house_id = m.house_id AND hm.status = 'approved'
        JOIN apartment_memberships am ON am.membership_id = hm.id
          AND am.house_id = m.house_id AND am.verification_status = 'verified'
          AND (m.audience = 'all_residents' OR am.relationship = 'owner')
        WHERE q.meeting_id IN (${Prisma.join(meetingIds)})
        UNION ALL
        SELECT p.meeting_id AS meetingId, am.apartment_id AS apartmentId
        FROM meeting_participations p
        JOIN meetings m ON m.id = p.meeting_id
        JOIN house_memberships hm ON hm.user_id = p.user_id
          AND hm.house_id = m.house_id AND hm.status = 'approved'
        JOIN apartment_memberships am ON am.membership_id = hm.id
          AND am.house_id = m.house_id AND am.verification_status = 'verified'
          AND (m.audience = 'all_residents' OR am.relationship = 'owner')
        WHERE p.meeting_id IN (${Prisma.join(meetingIds)}) AND p.will_attend = true
      ) activity
      GROUP BY activity.meetingId
    `;
    const result = new Map<number, { users: number; apartments: number }>();
    for (const count of userCounts) {
      result.set(Number(count.meetingId), {
        users: Number(count.participantsCount),
        apartments: 0,
      });
    }
    for (const count of apartmentCounts) {
      const meetingId = Number(count.meetingId);
      const item = result.get(meetingId) ?? { users: 0, apartments: 0 };
      item.apartments = Number(count.apartmentsCount);
      result.set(meetingId, item);
    }
    return result;
  }
}
