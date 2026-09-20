import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../auth/public.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({
    operationId: 'getHealth',
    summary: 'Проверка доступности API и MySQL',
    security: [],
  })
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiServiceUnavailableResponse({ type: ErrorResponseDto })
  check(): Promise<HealthResponseDto> {
    return this.health.check();
  }
}
