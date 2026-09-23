import type { Meeting } from '@generated/prisma/client';
import type { MeetingDto } from '../dto/meeting.dto';
import { MeetingStatus } from '../enums/meeting-status.enum';

export function toMeetingResponse(
  meeting: Pick<
    Meeting,
    | 'id'
    | 'houseId'
    | 'title'
    | 'format'
    | 'location'
    | 'startsAt'
    | 'endsAt'
    | 'isCancelled'
  >,
  now: Date,
  participantsCount: number,
): MeetingDto {
  let status: MeetingStatus;
  if (meeting.isCancelled) status = MeetingStatus.CANCELLED;
  else if (meeting.endsAt <= now) status = MeetingStatus.CLOSED;
  else if (meeting.startsAt > now) status = MeetingStatus.SCHEDULED;
  else status = MeetingStatus.ACTIVE;

  return {
    id: meeting.id,
    houseId: meeting.houseId,
    title: meeting.title,
    format: meeting.format,
    location: meeting.location,
    status,
    startsAt: meeting.startsAt.toISOString(),
    endsAt: meeting.endsAt.toISOString(),
    participantsCount,
  };
}
