import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { HousesController } from './houses.controller';
import { HousesService } from './houses.service';

@Module({
  imports: [PrismaModule],
  controllers: [HousesController],
  providers: [HousesService],
  exports: [HousesService],
})
export class HousesModule {}
