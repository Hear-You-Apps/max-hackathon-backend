import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment } from '@config/environment';
import type { MaxUserData } from './auth.types';

@Injectable()
export class MaxAuthService {
  private readonly secretKey: Buffer;
  private readonly maxAge: number;

  constructor(config: ConfigService<Environment, true>) {
    this.secretKey = createHmac('sha256', 'WebAppData')
      .update(config.get('MAX_BOT_TOKEN', { infer: true }))
      .digest();
    this.maxAge = config.get('MAX_INIT_DATA_MAX_AGE', { infer: true });
  }

  validate(initData: string): MaxUserData {
    const params = this.parseParameters(initData);
    const hash = params.get('hash');

    if (!hash || !/^[a-f\d]{64}$/i.test(hash)) {
      throw new UnauthorizedException('Invalid MAX initData');
    }

    params.delete('hash');
    const launchParams = [...params.keys()]
      .sort()
      .map((key) => `${key}=${params.get(key)}`)
      .join('\n');
    const signature = createHmac('sha256', this.secretKey)
      .update(launchParams)
      .digest();

    if (!timingSafeEqual(signature, Buffer.from(hash, 'hex'))) {
      throw new UnauthorizedException('Invalid MAX initData signature');
    }

    const rawAuthDate = params.get('auth_date') ?? '';
    const authDate = Number(rawAuthDate);
    const now = Math.floor(Date.now() / 1000);

    if (
      !/^\d+$/.test(rawAuthDate) ||
      !Number.isSafeInteger(authDate) ||
      authDate <= 0
    ) {
      throw new UnauthorizedException('Invalid MAX auth_date');
    }

    if (authDate > now + 30 || now - authDate > this.maxAge) {
      throw new UnauthorizedException('Expired or invalid MAX auth_date');
    }

    return this.parseUser(params.get('user') ?? '');
  }

  private parseParameters(initData: string): Map<string, string> {
    const params = new Map<string, string>();

    for (const entry of initData.split('&')) {
      const separator = entry.indexOf('=');
      const key = entry.slice(0, separator);

      if (separator <= 0 || !/^[a-zA-Z0-9_]+$/.test(key) || params.has(key)) {
        throw new UnauthorizedException('Invalid MAX initData parameters');
      }

      try {
        params.set(key, decodeURIComponent(entry.slice(separator + 1)));
      } catch {
        throw new UnauthorizedException('Invalid MAX initData encoding');
      }
    }

    return params;
  }

  private parseUser(rawUser: string): MaxUserData {
    let user: unknown;
    try {
      user = JSON.parse(rawUser);
    } catch {
      throw new UnauthorizedException('Invalid MAX user');
    }

    if (
      typeof user !== 'object' ||
      user === null ||
      !('id' in user) ||
      typeof user.id !== 'number' ||
      !Number.isSafeInteger(user.id) ||
      user.id <= 0 ||
      !('first_name' in user) ||
      typeof user.first_name !== 'string'
    ) {
      throw new UnauthorizedException('Invalid MAX user');
    }

    const result: MaxUserData = { id: user.id, first_name: user.first_name };

    for (const key of ['last_name', 'username', 'photo_url'] as const) {
      if (!(key in user)) continue;
      const value: unknown = (user as Record<string, unknown>)[key];

      if (value !== null && typeof value !== 'string') {
        throw new UnauthorizedException('Invalid MAX user');
      }

      result[key] = value;
    }

    return result;
  }
}
