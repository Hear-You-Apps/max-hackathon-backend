import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { validateEnvironment } from './config/environment';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule, EchoModule } from './modules';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    AuthModule,
    PrismaModule,
    HealthModule,
    EchoModule,
  ],
})
export class AppModule {}
