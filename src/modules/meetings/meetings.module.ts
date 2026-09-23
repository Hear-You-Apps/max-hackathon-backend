import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { HousesModule } from '../houses/houses.module';
import { HouseMeetingsController } from './house-meetings.controller';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

@Module({
  imports: [PrismaModule, HousesModule],
  controllers: [HouseMeetingsController, MeetingsController],
  providers: [MeetingsService],
})
export class MeetingsModule {}
