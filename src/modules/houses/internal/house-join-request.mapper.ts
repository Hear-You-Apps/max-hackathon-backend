import { HouseMembershipStatus } from '@generated/prisma/enums';
import type { MyHouseJoinRequestDto } from '../dto/my-houses-response.dto';
import type { JoinRequestWithHouse } from './house.selects';
import { readPermissions } from './house.permissions';

export function toJoinRequestResponse(
  request: JoinRequestWithHouse,
  membershipStatus?: HouseMembershipStatus,
): MyHouseJoinRequestDto {
  return {
    id: request.id,
    house: request.house,
    apartmentNumber: request.apartmentNumber,
    displayName: request.displayName,
    relationship: request.relationship,
    status: request.status,
    rejectionReason: request.rejectionReason,
    notifications: {
      meetings: request.notifyMeetings,
      requests: request.notifyRequests,
    },
    permissions:
      membershipStatus === HouseMembershipStatus.revoked
        ? []
        : [...readPermissions],
  };
}
