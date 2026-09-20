import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { UserProfileDto } from '../dto/user-profile.dto';
import type { UserRequest } from '../users.types';

export const User = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserProfileDto => {
    const user = context.switchToHttp().getRequest<UserRequest>().user;
    if (!user) throw new UnauthorizedException('User account required');
    return user;
  },
);
