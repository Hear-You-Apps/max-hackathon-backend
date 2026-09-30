import { ApiProperty } from '@nestjs/swagger';
import {
  RequestCategory,
  RequestLocationType,
  RequestStatus,
  RequestVisibility,
} from '@generated/prisma/enums';
import { FileDto } from '../../files/dto/file.dto';

export class RequestAuthorDto {
  @ApiProperty({ type: 'integer', example: 1 })
  id!: number;

  @ApiProperty({ example: 'Олег Чикелев' })
  name!: string;
}

export class RequestApartmentDto {
  @ApiProperty({ type: 'integer', example: 1 })
  id!: number;

  @ApiProperty({ example: '112' })
  number!: string;
}

export class RequestDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: 'abf319d9-b173-4aeb-b9bb-7ca6e15e6df8',
  })
  id!: string;

  @ApiProperty({
    type: 'integer',
    example: 148,
    description: 'Номер заявки для отображения',
  })
  number!: number;

  @ApiProperty({ type: 'integer', example: 1 })
  houseId!: number;

  @ApiProperty({ example: 'Течёт кровля над пятым подъездом' })
  title!: string;

  @ApiProperty({ enum: RequestCategory, enumName: 'RequestCategory' })
  category!: RequestCategory;

  @ApiProperty({ enum: RequestLocationType, enumName: 'RequestLocationType' })
  locationType!: RequestLocationType;

  @ApiProperty({ enum: RequestVisibility, enumName: 'RequestVisibility' })
  visibility!: RequestVisibility;

  @ApiProperty({
    enum: RequestStatus,
    enumName: 'RequestStatus',
    description:
      'submitted: отправлена, in_review: на рассмотрении, in_progress: решается, resolved: ждёт подтверждения, closed: закрыта, cancelled: отменена',
  })
  status!: RequestStatus;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-09-27T09:12:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    type: RequestAuthorDto,
    nullable: true,
    description: 'Автор, null если аккаунт удалён',
  })
  author!: RequestAuthorDto | null;

  @ApiProperty({ example: true, description: 'Заявка текущего пользователя' })
  isMine!: boolean;

  @ApiProperty({
    type: 'integer',
    example: 12,
    description: 'Сколько жителей подписано',
  })
  subscribersCount!: number;
}

export class RequestEventDto {
  @ApiProperty({ type: 'integer', example: 1 })
  id!: number;

  @ApiProperty({ enum: RequestStatus, enumName: 'RequestStatus' })
  status!: RequestStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Мастер приедет завтра утром',
  })
  comment!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-09-27T09:12:00.000Z',
  })
  createdAt!: string;
}

export class RequestDetailsResponseDto extends RequestDto {
  @ApiProperty({ example: false, description: 'Вы подписаны на эту заявку' })
  isSubscribed!: boolean;

  @ApiProperty({ example: 'После дождя вода течёт по стене у лифта' })
  description!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Пятый подъезд, девятый этаж',
  })
  locationText!: string | null;

  @ApiProperty({
    type: RequestApartmentDto,
    nullable: true,
    description: 'Квартира видна автору и админам, для остальных null',
  })
  apartment!: RequestApartmentDto | null;

  @ApiProperty({ type: [FileDto], description: 'Фото и документы заявки' })
  attachments!: FileDto[];

  @ApiProperty({
    type: [RequestEventDto],
    description: 'История обработки от старых событий к новым',
  })
  events!: RequestEventDto[];
}

export class RequestsResponseDto {
  @ApiProperty({ type: [RequestDto] })
  items!: RequestDto[];

  @ApiProperty({ type: 'integer', example: 1 })
  page!: number;

  @ApiProperty({ type: 'integer', example: 20 })
  limit!: number;

  @ApiProperty({
    type: 'integer',
    example: 42,
    description: 'Всего заявок с учётом фильтров и доступа',
  })
  total!: number;
}
