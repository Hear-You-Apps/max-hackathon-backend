import { Module } from '@nestjs/common';
import { InitService } from './init.service';
import { InitController } from './init.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [InitController],
  providers: [InitService],
})
export class InitModule {}
