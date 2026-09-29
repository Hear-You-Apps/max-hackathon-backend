import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { HousesModule } from '../houses/houses.module';
import { PollsModule } from '../polls/polls.module';
import { HouseMeetingsController } from './house-meetings.controller';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { MeetingCreationService } from './meeting-creation.service';
import { MeetingVotesService } from './meeting-votes.service';
import { MeetingParticipationService } from './meeting-participation.service';

@Module({
  imports: [PrismaModule, HousesModule, PollsModule],
  controllers: [HouseMeetingsController, MeetingsController],
  providers: [
    MeetingsService,
    MeetingCreationService,
    MeetingVotesService,
    MeetingParticipationService,
  ],
})
export class MeetingsModule {}
