import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Update } from '@maxhub/max-bot-api/types';
import { Public } from '@auth/public.decorator';
import { MaxBotService } from './max-bot.service';

@Public()
@ApiExcludeController()
@Controller('max-bot')
export class MaxBotController {
  constructor(private readonly bot: MaxBotService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleUpdate(
    @Headers('x-max-bot-api-secret') secret: string | undefined,
    @Body() update: Update,
  ): Promise<void> {
    return this.bot.handleUpdate(secret, update);
  }
}
