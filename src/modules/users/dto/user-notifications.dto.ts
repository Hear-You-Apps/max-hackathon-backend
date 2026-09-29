import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UserNotificationsDto {
  @ApiProperty({
    type: Boolean,
    description: 'Уведомления о собраниях и заявках во всех домах',
  })
  @IsBoolean({ message: 'notificationsEnabled должен быть true или false' })
  notificationsEnabled!: boolean;
}
