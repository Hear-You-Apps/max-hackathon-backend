import type {
  HouseJoinRequest,
  HouseMembership,
} from '@generated/prisma/client';
import {
  HouseJoinRequestStatus,
  HouseMembershipStatus,
} from '@generated/prisma/enums';

export function isCurrentJoinRequest(
  request: Pick<HouseJoinRequest, 'status' | 'createdAt'>,
  membership: Pick<HouseMembership, 'status' | 'lastLeftAt'> | null | undefined,
): boolean {
  if (
    request.status !== HouseJoinRequestStatus.pending &&
    request.status !== HouseJoinRequestStatus.rejected
  ) {
    return false;
  }
  if (!membership) return true;
  if (membership.lastLeftAt) {
    return request.createdAt > membership.lastLeftAt;
  }
  return membership.status !== HouseMembershipStatus.left;
}
