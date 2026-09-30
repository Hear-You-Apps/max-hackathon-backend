import type { Prisma, StoredFile } from '@generated/prisma/client';
import type { FileDto } from '../dto/file.dto';

export const fileSelect = {
  storageKey: true,
  originalName: true,
  mimeType: true,
  size: true,
} satisfies Prisma.StoredFileSelect;

export function toFileResponse(
  file: Pick<StoredFile, 'storageKey' | 'originalName' | 'mimeType' | 'size'>,
): FileDto {
  return {
    id: file.storageKey,
    name: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    url: `/api/files/${file.storageKey}`,
  };
}
