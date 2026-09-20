import { SetMetadata } from '@nestjs/common';

export const ALLOW_UNINITIALIZED_KEY = 'allowUninitialized';
export const AllowUninitialized = () =>
  SetMetadata(ALLOW_UNINITIALIZED_KEY, true);
