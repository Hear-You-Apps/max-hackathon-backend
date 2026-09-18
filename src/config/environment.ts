import { plainToInstance, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export class Environment {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV = 'development';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsString()
  CORS_ORIGINS = 'http://localhost:5173,http://localhost:3000';

  @IsString()
  @IsNotEmpty()
  DB_HOST!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT = 3306;

  @IsString()
  @IsNotEmpty()
  DB_NAME!: string;

  @IsString()
  @IsNotEmpty()
  DB_USER!: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD!: string;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const environment = plainToInstance(Environment, config);
  const errors = validateSync(environment, {
    validationError: { target: false, value: false },
  });

  if (errors.length > 0) {
    const details = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return environment;
}
