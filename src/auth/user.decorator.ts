import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface MaxUser {
  id: number;
  first_name: string;
  last_name?: string | null;
  username?: string | null;
  language_code?: string | null;
  photo_url?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: MaxUser;
}

export const User = createParamDecorator(
  (_data: unknown, context: ExecutionContext): MaxUser | undefined =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
