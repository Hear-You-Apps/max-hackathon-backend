import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { HousesModule } from '../houses/houses.module';
import { RequestsModule } from '../requests/requests.module';
import { FilesController } from './files.controller';
import { HouseFilesController } from './house-files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [PrismaModule, HousesModule, RequestsModule],
  controllers: [FilesController, HouseFilesController],
  providers: [FilesService],
})
export class FilesModule {}
