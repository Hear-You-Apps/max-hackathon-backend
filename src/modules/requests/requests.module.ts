import { Module } from '@nestjs/common';
import { RequestAccessService } from './request-access.service';

@Module({
  providers: [RequestAccessService],
  exports: [RequestAccessService],
})
export class RequestsModule {}
