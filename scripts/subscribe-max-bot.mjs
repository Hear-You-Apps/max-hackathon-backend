import 'dotenv/config';
import { Bot } from '@maxhub/max-bot-api';

const token = process.env.MAX_BOT_TOKEN;
const secret = process.env.MAX_WEBHOOK_SECRET;
const webhookUrl = process.env.MAX_WEBHOOK_URL;

if (!token || !secret || !webhookUrl) {
  throw new Error(
    'Укажите MAX_BOT_TOKEN, MAX_WEBHOOK_SECRET и MAX_WEBHOOK_URL в .env',
  );
}

const bot = new Bot(token);
const result = await bot.api.subscribe(webhookUrl, secret, ['bot_started']);
if (!result.success) {
  throw new Error('Не удалось подключить вебхук MAX');
}

console.log(`Вебхук MAX подключён: ${webhookUrl}`);
