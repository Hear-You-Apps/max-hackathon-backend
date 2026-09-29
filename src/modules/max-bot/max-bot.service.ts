import { timingSafeEqual } from 'node:crypto';
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

const WELCOME_MESSAGE =
  'Привет! Это «Совет дома» — мини-приложение для жителей вашего дома.\n\n' +
  'Там можно узнать новости дома, участвовать в собраниях и опросах, отправлять заявки и следить за их решением.\n\n' +
  'Все действия - в мини-приложении, а сюда будут приходить уведомления.';

@Injectable()
export class MaxBotService {
  private readonly logger = new Logger(MaxBotService.name);
  private readonly bot: Bot;
  private readonly username: string;
  private readonly webhookSecret: string;

  constructor(config: ConfigService<Environment, true>) {
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
