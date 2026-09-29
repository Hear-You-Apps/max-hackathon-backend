import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { PollDto } from '../../polls/dto/poll.dto';
import { MeetingListItemDto } from './meeting.dto';

@ApiExtraModels(MeetingListItemDto, PollDto)
export class MeetingsResponseDto {
  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(MeetingListItemDto) },
        { $ref: getSchemaPath(PollDto) },
      ],
      discriminator: {
        propertyName: 'type',
        mapping: {
          meeting: getSchemaPath(MeetingListItemDto),
          poll: getSchemaPath(PollDto),
        },
      },
    },
    description: 'Собрания и опросы текущей страницы',
  })
  items!: (MeetingListItemDto | PollDto)[];

  @ApiProperty({ type: 'integer', example: 1, description: 'Номер страницы' })
  page!: number;

  @ApiProperty({ type: 'integer', example: 20, description: 'Размер страницы' })
  limit!: number;

  @ApiProperty({
    type: 'integer',
    example: 42,
    description: 'Количество собраний и опросов за выбранный период',
  })
  total!: number;
}
