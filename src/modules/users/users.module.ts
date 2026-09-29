import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { UsersService } from './users.service';
import { UserAccountGuard } from './guards/user-account.guard';
import { UsersController } from './users.controller';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, UserAccountGuard],
  exports: [UsersService, UserAccountGuard],
})
export class UsersModule {}
