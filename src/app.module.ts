import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/environment';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { EchoModule } from './echo/echo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    PrismaModule,
    HealthModule,
    EchoModule,
  ],
})
export class AppModule {}
