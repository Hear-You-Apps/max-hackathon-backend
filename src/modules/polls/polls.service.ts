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
import {
  ApartmentRelationship,
  ApartmentVerificationStatus,
  VotingAudience,
} from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';
import { HouseAccessService } from '../houses/services/house-access.service';
import type { CreatePollDto } from './dto/create-poll.dto';
import type { PollDto } from './dto/poll.dto';
import type { UpdatePollVotesDto } from './dto/update-poll-votes.dto';

export const pollSelect = {
  id: true,
  houseId: true,
  question: true,
  audience: true,
  allowMultiple: true,
  endsAt: true,
  options: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: { id: true, title: true },
  },
} satisfies Prisma.PollSelect;

export type PollData = Prisma.PollGetPayload<{ select: typeof pollSelect }>;

@Injectable()
export class PollsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly houseAccess: HouseAccessService,
  ) {}

  async create(
    userId: number,
    houseId: number,
    body: CreatePollDto,
  ): Promise<PollDto> {
    const endsAt = new Date(body.endsAt);
    if (
      !Number.isFinite(endsAt.getTime()) ||
      endsAt <= new Date() ||
      endsAt.getUTCFullYear() > 9999
    ) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        code: ErrorCode.INVALID_POLL_DATE,
        message: 'Срок опроса должен быть в будущем',
      });
    }

    const titles = body.options.map((option) =>
      option.title.toLocaleLowerCase('ru'),
    );
    if (new Set(titles).size !== titles.length) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        code: ErrorCode.INVALID_POLL_OPTIONS,
        message: 'Варианты ответа не должны повторяться',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      await this.houseAccess.checkAccess(tx, userId, houseId);

      const poll = await tx.poll.create({
        data: {
          houseId,
          authorId: userId,
          question: body.question,
          audience: body.audience,
          allowMultiple: body.allowMultiple,
          endsAt,
          options: {
            createMany: {
              data: body.options.map((option, sortOrder) => ({
                title: option.title,
                sortOrder,
              })),
            },
          },
        },
        select: pollSelect,
      });

      const polls = await this.toDtos(tx, [poll], userId, new Date());
      return polls.get(poll.id)!;
    });
  }

  async findOne(userId: number, pollId: number): Promise<PollDto> {
    return this.prisma.$transaction(async (tx) => {
      const poll = await tx.poll.findUnique({
        where: { id: pollId },
        select: pollSelect,
      });
      if (
        !poll ||
        !(await this.houseAccess.hasAccess(tx, userId, poll.houseId))
      ) {
        throw this.notAvailable();
      }
      const polls = await this.toDtos(tx, [poll], userId, new Date());
      return polls.get(pollId)!;
    });
  }

  async updateVotes(
    userId: number,
    pollId: number,
    body: UpdatePollVotesDto,
  ): Promise<PollDto> {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
        const poll = await tx.poll.findUnique({
          where: { id: pollId },
          select: pollSelect,
        });
        if (
          !poll ||
          !(await this.houseAccess.hasAccess(tx, userId, poll.houseId))
        ) {
          throw this.notAvailable();
        }

        const apartment = await tx.apartmentMembership.findFirst({
          where: {
            houseId: poll.houseId,
            membership: { userId },
            verificationStatus: ApartmentVerificationStatus.verified,
            ...(poll.audience === VotingAudience.owners
              ? { relationship: ApartmentRelationship.owner }
              : {}),
          },
          select: { apartmentId: true },
        });
        if (!apartment) {
          throw new ForbiddenException({
            statusCode: HttpStatus.FORBIDDEN,
            error: 'Forbidden',
            code: ErrorCode.POLL_VOTE_FORBIDDEN,
            message:
              poll.audience === VotingAudience.owners
                ? 'Отвечать могут только подтверждённые собственники'
                : 'Отвечать могут только подтверждённые жители',
          });
        }

        this.checkVotingAvailable(poll.endsAt);
        if (
          (!poll.allowMultiple && body.optionIds.length > 1) ||
          body.optionIds.some(
            (optionId) =>
              !poll.options.some((option) => option.id === optionId),
          )
        ) {
          throw new BadRequestException({
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            code: ErrorCode.INVALID_POLL_OPTIONS,
            message: 'Проверьте выбранные варианты ответа',
          });
        }

        await tx.pollVote.deleteMany({ where: { pollId, userId } });
        if (body.optionIds.length) {
          await tx.pollVote.createMany({
            data: body.optionIds.map((optionId) => ({
              pollId,
              userId,
              optionId,
            })),
          });
        }
        this.checkVotingAvailable(poll.endsAt);
        const polls = await this.toDtos(tx, [poll], userId, new Date());
        return polls.get(pollId)!;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }

  async toDtos(
    tx: Prisma.TransactionClient,
    polls: PollData[],
    userId: number,
    now: Date,
  ): Promise<Map<number, PollDto>> {
    if (!polls.length) return new Map();

    const pollIds = polls.map((poll) => poll.id);
    const [optionCounts, responseCounts, myVotes] = await Promise.all([
      tx.pollVote.groupBy({
        by: ['pollId', 'optionId'],
        where: { pollId: { in: pollIds } },
        _count: { _all: true },
      }),
      tx.$queryRaw<{ pollId: bigint; responsesCount: bigint }[]>`
        SELECT poll_id AS pollId, COUNT(DISTINCT user_id) AS responsesCount
        FROM poll_votes
        WHERE poll_id IN (${Prisma.join(pollIds)})
        GROUP BY poll_id
      `,
      tx.pollVote.findMany({
        where: { userId, pollId: { in: pollIds } },
        select: { pollId: true, optionId: true },
      }),
    ]);
    const countsByOption = new Map(
      optionCounts.map((count) => [count.optionId, count._count._all]),
    );
    const responsesByPoll = new Map(
      responseCounts.map((count) => [
        Number(count.pollId),
        Number(count.responsesCount),
      ]),
    );
    const myOptionsByPoll = new Map<number, Set<number>>();
    for (const vote of myVotes) {
      const options = myOptionsByPoll.get(vote.pollId) ?? new Set<number>();
      options.add(vote.optionId);
      myOptionsByPoll.set(vote.pollId, options);
    }

    return new Map(
      polls.map((poll) => {
        const responsesCount = responsesByPoll.get(poll.id) ?? 0;
        const myOptions = myOptionsByPoll.get(poll.id) ?? new Set<number>();
        const dto: PollDto = {
          type: 'poll',
          id: poll.id,
          houseId: poll.houseId,
          question: poll.question,
          audience: poll.audience,
          allowMultiple: poll.allowMultiple,
          endsAt: poll.endsAt.toISOString(),
          status: poll.endsAt <= now ? 'closed' : 'active',
          resultsFinal: poll.endsAt <= now,
          responsesCount,
          myOptionIds: poll.options
            .filter((option) => myOptions.has(option.id))
            .map((option) => option.id),
          options: poll.options.map((option) => {
            const votesCount = countsByOption.get(option.id) ?? 0;
            return {
              ...option,
              votesCount,
              percent: responsesCount
                ? Math.round((votesCount / responsesCount) * 100)
                : 0,
            };
          }),
        };
        return [poll.id, dto];
      }),
    );
  }

  private checkVotingAvailable(endsAt: Date): void {
    if (endsAt > new Date()) return;
    throw new ConflictException({
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      code: ErrorCode.POLL_VOTING_UNAVAILABLE,
      message: 'Опрос уже закончился',
    });
  }

  private notAvailable(): NotFoundException {
    return new NotFoundException({
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      code: ErrorCode.POLL_NOT_AVAILABLE,
      message: 'Опрос не найден или недоступен',
    });
  }
}
