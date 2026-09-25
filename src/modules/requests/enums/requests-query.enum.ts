import { RequestStatus } from '@generated/prisma/enums';

export enum RequestsScope {
  MINE = 'mine',
  HOUSE = 'house',
}

export const RequestsStatusFilter = {
  all: 'all',
  open: 'open',
  ...RequestStatus,
} as const;

export type RequestsStatusFilter =
  (typeof RequestsStatusFilter)[keyof typeof RequestsStatusFilter];
