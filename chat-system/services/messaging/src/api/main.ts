import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { initializeTransactionalContext } from 'typeorm-transactional';
import axios from 'axios';

import { CommonConstants } from "@libs/shared/src/constants/common.constants";
import { GlobalExceptionFilter } from '@libs/shared/src/filters/global-exception.filter';

import { ApiModule } from './api.module';

axios.defaults.timeout = 5000;

async function bootstrap() {
  initializeTransactionalContext();

  const app = await NestFactory.create(ApiModule);

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // converts incoming JSON to DTO class instances
      transformOptions: {
        enableImplicitConversion: true, // Automatically convert types
      },
    })
  )

  const globalPrefix = CommonConstants.GLOBAL_PREFIX;

  app.setGlobalPrefix(globalPrefix);

  app.enableShutdownHooks();

  const port = process.env.PORT || CommonConstants.DEFAULT_PORT;
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  Logger.error(`Application failed to start: ${message}`, stack);
  process.exit(1);
});
