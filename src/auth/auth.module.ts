import { Module } from '@nestjs/common';
import { MaxAuthGuard } from './max-auth.guard';
import { MaxAuthService } from './max-auth.service';

@Module({
  providers: [MaxAuthService, MaxAuthGuard],
  exports: [MaxAuthGuard],
})
export class AuthModule {}
