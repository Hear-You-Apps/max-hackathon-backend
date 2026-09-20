import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MaxAuthGuard } from './max-auth.guard';
import { MaxAuthService } from './max-auth.service';

@Module({
  providers: [MaxAuthService, { provide: APP_GUARD, useClass: MaxAuthGuard }],
})
export class AuthModule {}
