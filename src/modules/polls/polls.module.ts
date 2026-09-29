import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { HousesModule } from '../houses/houses.module';
import { HousePollsController } from './house-polls.controller';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';

@Module({
  imports: [PrismaModule, HousesModule],
  controllers: [HousePollsController, PollsController],
  providers: [PollsService],
  exports: [PollsService],
})
export class PollsModule {}
