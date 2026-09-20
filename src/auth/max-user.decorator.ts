import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest, MaxUserData } from './auth.types';

export const MaxUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): MaxUserData => {
    const user = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>().maxUser;
    if (!user) throw new UnauthorizedException('MAX authentication required');
    return user;
  },
);
