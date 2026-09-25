import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { HousesModule } from '../houses/houses.module';
import { AdminHousesService } from './admin-houses.service';
import { AdminHousesController } from './admin-houses.controller';

@Module({
  imports: [PrismaModule, HousesModule],
  controllers: [AdminHousesController],
  providers: [AdminHousesService],
})
export class AdminHousesModule {}
