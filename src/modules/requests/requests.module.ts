import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { PrismaModule } from '@prisma/prisma.module';
import { HousesModule } from '../houses/houses.module';
import { HouseRequestsController } from './house-requests.controller';
import { RequestAccessService } from './request-access.service';

@Module({
  imports: [PrismaModule, HousesModule],
  controllers: [RequestsController, HouseRequestsController],
  providers: [RequestsService, RequestAccessService],
  exports: [RequestAccessService],
})
export class RequestsModule {}
