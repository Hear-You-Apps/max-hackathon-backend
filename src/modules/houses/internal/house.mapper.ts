import type { HousePreviewData } from './house.selects';

export function toHouseResponse<T extends HousePreviewData>(house: T) {
  const { _count, ...info } = house;
  return { ...info, residentsCount: _count.memberships };
}
