import type { Prisma } from '@generated/prisma/client';

export const houseSelect = {
  id: true,
  address: true,
  managementCompanyName: true,
  adminContactUrl: true,
  apartmentsCount: true,
  entrancesCount: true,
} satisfies Prisma.HouseSelect;

export const joinRequestSelect = {
  id: true,
  houseId: true,
  apartmentNumber: true,
  displayName: true,
  relationship: true,
  status: true,
  createdAt: true,
  rejectionReason: true,
  notifyMeetings: true,
  notifyRequests: true,
  house: { select: houseSelect },
} satisfies Prisma.HouseJoinRequestSelect;

export type JoinRequestWithHouse = Prisma.HouseJoinRequestGetPayload<{
  select: typeof joinRequestSelect;
}>;

export const houseEventSelect = {
  id: true,
  type: true,
  title: true,
  description: true,
  startsAt: true,
  endsAt: true,
  location: true,
  isCancelled: true,
} satisfies Prisma.HouseEventSelect;

export type HouseEventData = Prisma.HouseEventGetPayload<{
  select: typeof houseEventSelect;
}>;
