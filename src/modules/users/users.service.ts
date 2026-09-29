import { Injectable } from '@nestjs/common';
import type { MaxUserData } from '@auth/auth.types';
import { Prisma } from '@generated/prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import type { UserProfileDto } from './dto/user-profile.dto';

const profileSelect = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  photoUrl: true,
  notificationsEnabled: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByMaxId(maxId: number): Promise<UserProfileDto | null> {
    return this.prisma.user.findUnique({
      where: { maxId: BigInt(maxId) },
      select: profileSelect,
    });
  }

  async initialize(profile: MaxUserData): Promise<UserProfileDto> {
    const where = { maxId: BigInt(profile.id) };
    const data = {
      firstName: profile.first_name,
      lastName: profile.last_name,
      username: profile.username,
      photoUrl: profile.photo_url,
    };

    try {
      return await this.prisma.user.upsert({
        where,
        create: { ...where, ...data },
        update: data,
        select: profileSelect,
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      ) {
        throw error;
      }
      return this.prisma.user.update({ where, data, select: profileSelect });
    }
  }

  async updateNotifications(
    userId: number,
    enabled: boolean,
  ): Promise<boolean> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { notificationsEnabled: enabled },
      select: { notificationsEnabled: true },
    });
    return user.notificationsEnabled;
  }
}
