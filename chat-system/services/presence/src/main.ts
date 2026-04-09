import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { GlobalExceptionFilter } from '@libs/shared/src/filters/global-exception.filter';

import { CommonConstants } from '@libs/shared/src/constants/common.constants';
import { PresenceModule } from './presence/presence.module';

async function bootstrap() {
  const app = await NestFactory.create(PresenceModule);

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  const globalPrefix = CommonConstants.GLOBAL_PREFIX;
  app.setGlobalPrefix(globalPrefix);

  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
