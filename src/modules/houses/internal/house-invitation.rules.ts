import { GoneException, HttpStatus, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@common/enums/error-code.enum';
import type { HouseInvitation } from '@generated/prisma/client';

type InvitationValidity = Pick<HouseInvitation, 'expiresAt' | 'revokedAt'>;

export function checkInvitation(
  invitation: InvitationValidity | null,
): asserts invitation is InvitationValidity {
  if (!invitation) {
    throw new NotFoundException({
      statusCode: HttpStatus.NOT_FOUND,
      error: 'Not Found',
      code: ErrorCode.INVITATION_NOT_FOUND,
      message: 'Дом с таким кодом приглашения не найден',
    });
  }
  if (invitation.revokedAt) {
    throw new GoneException({
      statusCode: HttpStatus.GONE,
      error: 'Gone',
      code: ErrorCode.INVITATION_REVOKED,
      message:
        'Приглашение отозвано. Запросите новый код у администратора дома',
    });
  }
  if (invitation.expiresAt.getTime() <= Date.now()) {
    throw new GoneException({
      statusCode: HttpStatus.GONE,
      error: 'Gone',
      code: ErrorCode.INVITATION_EXPIRED,
      message:
        'Срок действия приглашения истёк. Запросите новый код у администратора дома',
    });
  }
}
