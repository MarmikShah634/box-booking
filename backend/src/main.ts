import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { loadConfig } from './config/configuration';

async function bootstrap() {
  // Validate env at boot — throws and exits if invalid
  const config = loadConfig();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Pino logger
  app.useLogger(app.get(Logger));

  // Security
  app.use(helmet());
  app.use(cookieParser());

  // CORS
  const origins = config.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Step-Up-Token'],
  });

  // Global filter + interceptor
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TimeoutInterceptor(30_000));

  // API prefix
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  await app.listen(config.PORT);

  const logger = app.get(Logger);
  logger.log(`API listening on port ${config.PORT} [${config.NODE_ENV}]`);
}

bootstrap();
