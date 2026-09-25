import type { Prisma } from '@generated/prisma/client';
import { fileSelect, toFileResponse } from '../../files/internal/file.mapper';
import type { RequestDto, RequestDetailsResponseDto } from '../dto/request.dto';

export const requestSelect = {
  id: true,
  houseId: true,
  authorId: true,
  title: true,
  category: true,
  locationType: true,
  visibility: true,
  status: true,
  createdAt: true,
  author: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.ServiceRequestSelect;

export const requestDetailsSelect = {
  ...requestSelect,
  description: true,
  locationText: true,
  apartment: { select: { id: true, number: true } },
  attachments: { orderBy: { id: 'asc' }, select: fileSelect },
  events: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true, status: true, comment: true, createdAt: true },
  },
} satisfies Prisma.ServiceRequestSelect;

export function toRequestResponse(
  request: Prisma.ServiceRequestGetPayload<{ select: typeof requestSelect }>,
  userId: number,
): RequestDto {
  return {
    id: request.id,
    houseId: request.houseId,
    title: request.title,
    category: request.category,
    locationType: request.locationType,
    visibility: request.visibility,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    author: request.author
      ? {
          id: request.author.id,
          name: [request.author.firstName, request.author.lastName]
            .filter(Boolean)
            .join(' '),
        }
      : null,
    isMine: request.authorId === userId,
  };
}

export function toRequestDetailsResponse(
  request: Prisma.ServiceRequestGetPayload<{
    select: typeof requestDetailsSelect;
  }>,
  userId: number,
  isAdmin: boolean,
): RequestDetailsResponseDto {
  return {
    ...toRequestResponse(request, userId),
    description: request.description,
    locationText: request.locationText,
    apartment:
      request.authorId === userId || isAdmin ? request.apartment : null,
    attachments: request.attachments.map(toFileResponse),
    events: request.events.map((event) => ({
      ...event,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}
