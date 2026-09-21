import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '@auth/auth.module';
import { MaxAuthGuard } from '@auth/max-auth.guard';
import { validateEnvironment } from '@config/environment';
import { PrismaModule } from '@prisma/prisma.module';
import {
  HealthModule,
  EchoModule,
  InitModule,
  UsersModule,
  HousesModule,
} from './modules';
import { UserAccountGuard } from '@users/guards/user-account.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    AuthModule,
    PrismaModule,
    HealthModule,
    EchoModule,
    InitModule,
    UsersModule,
    HousesModule,
  ],
  providers: [
    { provide: APP_GUARD, useExisting: MaxAuthGuard },
    { provide: APP_GUARD, useExisting: UserAccountGuard },
  ],
})
export class AppModule {}
