import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { MaxBotModule } from '../max-bot/max-bot.module';
import { DebugController } from './debug.controller';
import { DebugService } from './debug.service';

@Module({
  imports: [PrismaModule, MaxBotModule],
  controllers: [DebugController],
  providers: [DebugService],
})
export class DebugModule {}
