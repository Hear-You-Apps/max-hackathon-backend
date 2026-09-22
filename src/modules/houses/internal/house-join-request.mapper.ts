import type { MyHouseJoinRequestDto } from '../dto/my-houses-response.dto';
import type { JoinRequestWithHouse } from './house.selects';

export function toJoinRequestResponse(
  request: JoinRequestWithHouse,
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
  };
}
