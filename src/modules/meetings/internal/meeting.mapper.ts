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
    | 'audience'
    | 'location'
    | 'startsAt'
    | 'endsAt'
    | 'isCancelled'
    | 'participationThresholdPercent'
  >,
  now: Date,
  participantsCount: number,
  participatingApartmentsCount: number,
  apartmentsCount: number | null,
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
    audience: meeting.audience,
    location: meeting.location,
    status,
    resultsFinal: status === MeetingStatus.CLOSED,
    startsAt: meeting.startsAt.toISOString(),
    endsAt: meeting.endsAt.toISOString(),
    participantsCount,
    participationThresholdPercent: meeting.participationThresholdPercent,
    apartmentsCount,
    participatingApartmentsCount,
    participationThresholdReached:
      meeting.participationThresholdPercent === null || apartmentsCount === null
        ? null
        : participatingApartmentsCount >=
          Math.ceil(
            (apartmentsCount * meeting.participationThresholdPercent) / 100,
          ),
  };
}
