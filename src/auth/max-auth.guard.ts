import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MaxAuthService } from './max-auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { AuthenticatedRequest } from './user.decorator';

@Injectable()
export class MaxAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: MaxAuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const match = /^Bearer[\t ]+(\S+)$/i.exec(
      request.headers.authorization ?? '',
    );

    if (!match) {
      throw new UnauthorizedException('Missing or invalid Bearer token');
    }

    request.user = this.auth.validate(match[1]);
    return true;
  }
}
