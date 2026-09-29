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
import { HouseMembershipStatus } from '@generated/prisma/enums';
import { PrismaService } from '@prisma/prisma.service';

const WELCOME_MESSAGE =
  'Привет! Это «Совет дома» — мини-приложение для жителей вашего дома.\n\n' +
  'Там можно узнать новости дома, участвовать в собраниях и опросах, отправлять заявки и следить за их решением.\n\n' +
  'Все действия - в мини-приложении, а сюда будут приходить уведомления.';
const MESSAGE_INTERVAL_MS = 50; // лимит MAX — 30 запросов в секунду

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
    this.notifications = this.notifications
      .then(() => this.sendMeetingCreated(houseId, meetingId, title))
      .catch(() => {
        this.logger.error(
          `Не удалось подготовить уведомления о собрании ${meetingId}`,
        );
      });
  }

  private async sendMeetingCreated(
    houseId: number,
    meetingId: number,
    title: string,
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

    const text = `Новое собрание в доме ${house.address}\n\n${title}`;
    const keyboard = Keyboard.inlineKeyboard([
      [
        Keyboard.button.openApp(
          'Открыть собрание',
          this.username,
          undefined,
          `meeting_${meetingId}`,
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
        `Не доставили уведомление о собрании ${meetingId}: ${failed} из ${house.memberships.length}`,
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
