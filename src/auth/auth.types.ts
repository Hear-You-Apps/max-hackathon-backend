import type { Request } from 'express';

export interface MaxUserData {
  id: number;
  first_name: string;
  last_name?: string | null;
  username?: string | null;
  photo_url?: string | null;
}

export interface AuthenticatedRequest extends Request {
  maxUser?: MaxUserData;
}
