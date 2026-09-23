import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { HousesController } from './houses.controller';
import { HousesQueryService } from './services/houses-query.service';
import { HouseJoinRequestsService } from './services/house-join-requests.service';
import { HouseMembershipsService } from './services/house-memberships.service';
import { HouseAccessService } from './services/house-access.service';

@Module({
  imports: [PrismaModule],
  controllers: [HousesController],
  providers: [
    HousesQueryService,
    HouseJoinRequestsService,
    HouseMembershipsService,
    HouseAccessService,
  ],
  exports: [HousesQueryService, HouseAccessService],
})
export class HousesModule {}
