import { Injectable } from '@nestjs/common';
import type { MaxUserData } from '../../auth/auth.types';
import { UsersService } from '../users/users.service';
import { HousesService } from '../houses/houses.service';
import type { InitResponseDto } from './dto/init-response.dto';

@Injectable()
export class InitService {
  constructor(
    private readonly users: UsersService,
    private readonly houses: HousesService,
  ) {}

  async initialize(profile: MaxUserData): Promise<InitResponseDto> {
    const user = await this.users.initialize(profile);
    return { user, ...(await this.houses.findMine(user.id)) };
  }
}
