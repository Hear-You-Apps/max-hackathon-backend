import { Module } from '@nestjs/common';
import { InitService } from './init.service';
import { InitController } from './init.controller';
import { UsersModule } from '../users/users.module';
import { HousesModule } from '../houses/houses.module';

@Module({
  imports: [UsersModule, HousesModule],
  controllers: [InitController],
  providers: [InitService],
})
export class InitModule {}
