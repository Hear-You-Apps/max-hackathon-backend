import type { Prisma, StoredFile } from '@generated/prisma/client';
import type { FileDto } from '../dto/file.dto';

export const fileSelect = {
  id: true,
  originalName: true,
  mimeType: true,
  size: true,
} satisfies Prisma.StoredFileSelect;

export function toFileResponse(
  file: Pick<StoredFile, 'id' | 'originalName' | 'mimeType' | 'size'>,
): FileDto {
  return {
    id: file.id,
    name: file.originalName,
    mimeType: file.mimeType,
    size: file.size,
    url: `/api/files/${file.id}`,
  };
}
