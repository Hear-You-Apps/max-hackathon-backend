import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { HousesModule } from '../houses/houses.module';
import { MaxBotModule } from '../max-bot/max-bot.module';
import { HousePollsController } from './house-polls.controller';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';

@Module({
  imports: [PrismaModule, HousesModule, MaxBotModule],
  controllers: [HousePollsController, PollsController],
  providers: [PollsService],
  exports: [PollsService],
})
export class PollsModule {}
