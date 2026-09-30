import { RequestStatus } from '@generated/prisma/enums';

export enum RequestsScope {
  MINE = 'mine',
  HOUSE = 'house',
}

export const RequestsStatusFilter = {
  all: 'all',
  open: 'open',
  completed: 'completed',
  ...RequestStatus,
} as const;

export type RequestsStatusFilter =
  (typeof RequestsStatusFilter)[keyof typeof RequestsStatusFilter];
