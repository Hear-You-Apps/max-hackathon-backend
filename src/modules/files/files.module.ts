import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { HousesModule } from '../houses/houses.module';
import { RequestsModule } from '../requests/requests.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [PrismaModule, HousesModule, RequestsModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
