import { Injectable } from '@nestjs/common';
import type { MaxUserData } from '../../auth/auth.types';
import { UsersService } from '../users/users.service';
import type { InitResponseDto } from './dto/init-response.dto';

@Injectable()
export class InitService {
  constructor(private readonly users: UsersService) {}

  async initialize(profile: MaxUserData): Promise<InitResponseDto> {
    return { user: await this.users.initialize(profile) };
  }
}
