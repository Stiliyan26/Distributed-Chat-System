import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { initializeTransactionalContext } from 'typeorm-transactional';

import cookieParser from 'cookie-parser';

import { CommonConstants } from "@libs/shared/src/constants/common.constants";

import { GlobalExceptionFilter } from '@libs/shared/src/filters/global-exception.filter';
import { AuthModule } from './auth/auth.module';

async function bootstrap() {
  initializeTransactionalContext();

  const app = await NestFactory.create(AuthModule);
  const globalPrefix = CommonConstants.GLOBAL_PREFIX;

  app.setGlobalPrefix(globalPrefix);
  app.enableCors({
    origin: true,
    credentials: true // Allows cookies to be sent
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true, // strips properties not in DTO
      forbidNonWhitelisted: true, // throws error on extra props
    }));

  app.enableShutdownHooks()
  app.use(cookieParser())

  const port = process.env.PORT || 3000;
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
