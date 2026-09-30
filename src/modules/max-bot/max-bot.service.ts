import { timingSafeEqual } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { Bot, Keyboard } from '@maxhub/max-bot-api';
import type { Update } from '@maxhub/max-bot-api/types';
import {
  Injectable,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment } from '@config/environment';
import { ErrorCode } from '@common/enums/error-code.enum';
import { HouseMembershipStatus, RequestStatus } from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';

const WELCOME_MESSAGE =
  'Привет! Это «Совет дома» — мини-приложение для жителей вашего дома.\n\n' +
  'Там можно узнать новости дома, участвовать в собраниях и опросах, отправлять заявки и следить за их решением.\n\n' +
  'Все действия - в мини-приложении, а сюда будут приходить уведомления.';
const MESSAGE_INTERVAL_MS = 50; // лимит MAX — 30 запросов в секунду
const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: 'Отправлена',
  in_review: 'На рассмотрении',
  in_progress: 'Решается',
  resolved: 'Решена, ждёт подтверждения',
  closed: 'Закрыта',
  cancelled: 'Отменена',
};

@Injectable()
export class MaxBotService {
  private readonly logger = new Logger(MaxBotService.name);
  private readonly bot: Bot;
  private readonly username: string;
  private readonly webhookSecret: string;
  private notifications: Promise<void> = Promise.resolve();

  constructor(
    config: ConfigService<Environment, true>,
    private readonly prisma: PrismaService,
  ) {
    this.bot = new Bot(config.get('MAX_BOT_TOKEN', { infer: true }));
    this.username = config.get('MAX_BOT_USERNAME', { infer: true });
    this.webhookSecret = config.get('MAX_WEBHOOK_SECRET', { infer: true });
  }

  async handleUpdate(
    secret: string | undefined,
    update: Update,
  ): Promise<void> {
    if (!this.webhookSecret) {
      throw new ServiceUnavailableException({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: 'Service Unavailable',
        code: ErrorCode.BOT_WEBHOOK_NOT_CONFIGURED,
        message: 'Вебхук бота не настроен',
      });
    }

    if (!this.isValidSecret(secret)) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        error: 'Unauthorized',
        code: ErrorCode.BOT_WEBHOOK_UNAUTHORIZED,
        message: 'Неверный секрет вебхука',
      });
    }

    if (update?.update_type !== 'bot_started') return;

    const userId = update.user?.user_id;
    if (
      typeof userId !== 'number' ||
      !Number.isSafeInteger(userId) ||
      userId <= 0
    ) {
      this.logger.warn('Событие bot_started пришло без ID пользователя');
      return;
    }

    try {
      const keyboard = Keyboard.inlineKeyboard([
        [Keyboard.button.openApp('Открыть приложение', this.username)],
      ]);
      await this.bot.api.sendMessageToUser(userId, WELCOME_MESSAGE, {
        attachments: [keyboard],
      });
    } catch {
      this.logger.error('Не удалось связаться с MAX');
      throw this.messageFailed();
    }
  }

  notifyMeetingCreated(
    houseId: number,
    meetingId: number,
    title: string,
  ): void {
    this.notifyCreated(houseId, meetingId, title, 'meeting');
  }

  notifyPollCreated(houseId: number, pollId: number, question: string): void {
    this.notifyCreated(houseId, pollId, question, 'poll');
  }

  notifyRequestStatusChanged(
    requestId: number,
    status: RequestStatus,
    comment?: string | null,
  ): void {
    this.notifications = this.notifications
      .then(() => this.sendRequestStatusChanged(requestId, status, comment))
      .catch(() => {
        this.logger.error(
          `Не удалось подготовить уведомление о заявке ${requestId}`,
        );
      });
  }

  private async sendRequestStatusChanged(
    requestId: number,
    status: RequestStatus,
    comment?: string | null,
  ): Promise<void> {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: {
        houseId: true,
        title: true,
        house: { select: { address: true } },
        author: {
          select: { id: true, maxId: true, notificationsEnabled: true },
        },
      },
    });
    if (!request?.author?.notificationsEnabled) return;

    const membership = await this.prisma.houseMembership.findUnique({
      where: {
        userId_houseId: {
          userId: request.author.id,
          houseId: request.houseId,
        },
      },
      select: { status: true },
    });
    if (membership?.status !== HouseMembershipStatus.approved) return;

    const maxId = Number(request.author.maxId);
    if (!Number.isSafeInteger(maxId)) return;

    const text = [
      `Заявка №${requestId} в доме ${request.house.address}: ${REQUEST_STATUS_LABELS[status]}`,
      request.title,
      ...(comment ? [`Комментарий: ${comment}`] : []),
    ].join('\n\n');
    const keyboard = Keyboard.inlineKeyboard([
      [
        Keyboard.button.openApp(
          'Открыть заявку',
          this.username,
          undefined,
          `request_${requestId}`,
        ),
      ],
    ]);

    try {
      await this.bot.api.sendMessageToUser(maxId, text, {
        attachments: [keyboard],
      });
    } catch {
      this.logger.warn(`Не доставили уведомление о заявке ${requestId}`);
    }
  }

  private notifyCreated(
    houseId: number,
    id: number,
    title: string,
    type: 'meeting' | 'poll',
  ): void {
    this.notifications = this.notifications
      .then(() => this.sendCreated(houseId, id, title, type))
      .catch(() => {
        this.logger.error(
          `Не удалось подготовить уведомления ${type === 'meeting' ? 'о собрании' : 'об опросе'} ${id}`,
        );
      });
  }

  private async sendCreated(
    houseId: number,
    id: number,
    title: string,
    type: 'meeting' | 'poll',
  ): Promise<void> {
    const house = await this.prisma.house.findUnique({
      where: { id: houseId },
      select: {
        address: true,
        memberships: {
          where: {
            status: HouseMembershipStatus.approved,
            user: { notificationsEnabled: true },
          },
          select: { user: { select: { maxId: true } } },
        },
      },
    });
    if (!house) return;

    const text = `${type === 'meeting' ? 'Новое собрание' : 'Новый опрос'} в доме ${house.address}\n\n${title}`;
    const keyboard = Keyboard.inlineKeyboard([
      [
        Keyboard.button.openApp(
          type === 'meeting' ? 'Открыть собрание' : 'Открыть опрос',
          this.username,
          undefined,
          `${type}_${id}`,
        ),
      ],
    ]);

    let failed = 0;

    for (const membership of house.memberships) {
      const maxId = Number(membership.user.maxId);
      if (!Number.isSafeInteger(maxId)) {
        failed++;
        continue;
      }

      try {
        await this.bot.api.sendMessageToUser(maxId, text, {
          attachments: [keyboard],
        });
      } catch {
        failed++;
      }
      await setTimeout(MESSAGE_INTERVAL_MS);
    }

    if (failed) {
      this.logger.warn(
        `Не доставили уведомление ${type === 'meeting' ? 'о собрании' : 'об опросе'} ${id}: ${failed} из ${house.memberships.length}`,
      );
    }
  }

  private messageFailed(): ServiceUnavailableException {
    return new ServiceUnavailableException({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'Service Unavailable',
      code: ErrorCode.BOT_MESSAGE_FAILED,
      message: 'Не удалось отправить приветствие',
    });
  }

  private isValidSecret(secret: string | undefined): boolean {
    if (!secret) return false;

    const received = Buffer.from(secret);
    const expected = Buffer.from(this.webhookSecret);
    return (
      received.length === expected.length && timingSafeEqual(received, expected)
    );
  }
}
