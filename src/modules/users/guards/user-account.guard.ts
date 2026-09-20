import {
  CanActivate,
  ConflictException,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { UsersService } from '../users.service';
import { ALLOW_UNINITIALIZED_KEY } from '../decorators/allow-uninitialized.decorator';
import { IS_PUBLIC_KEY } from '../../../auth/public.decorator';
import type { UserRequest } from '../users.types';

@Injectable()
export class UserAccountGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      targets,
    );
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<UserRequest>();
    if (!request.maxUser) {
      throw new UnauthorizedException('MAX authentication required');
    }

    const allowUninitialized = this.reflector.getAllAndOverride<boolean>(
      ALLOW_UNINITIALIZED_KEY,
      targets,
    );
    if (allowUninitialized) {
      return true;
    }

    const user = await this.users.findByMaxId(request.maxUser.id);
    if (!user) {
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        code: ErrorCode.USER_NOT_INITIALIZED,
        message: 'Call POST /api/init to initialize your account',
      });
    }

    request.user = user;
    return true;
  }
}
