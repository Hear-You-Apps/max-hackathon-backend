import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { HousesModule } from '../houses/houses.module';
import { HouseMeetingsController } from './house-meetings.controller';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { MeetingCreationService } from './meeting-creation.service';

@Module({
  imports: [PrismaModule, HousesModule],
  controllers: [HouseMeetingsController, MeetingsController],
  providers: [MeetingsService, MeetingCreationService],
})
export class MeetingsModule {}
