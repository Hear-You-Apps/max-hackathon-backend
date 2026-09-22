import type { Prisma } from '@generated/prisma/client';

export const housePreviewSelect = {
  id: true,
  address: true,
  managementCompanyName: true,
  apartmentsCount: true,
  entrancesCount: true,
} satisfies Prisma.HouseSelect;

export const houseSelect = {
  ...housePreviewSelect,
  adminContactUrl: true,
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
  house: { select: housePreviewSelect },
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
