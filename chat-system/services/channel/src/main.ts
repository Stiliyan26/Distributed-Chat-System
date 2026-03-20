import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { initializeTransactionalContext } from 'typeorm-transactional';

import { CommonConstants } from "@libs/shared/src/constants/common.constants";
import { ChannelModule } from './channel/channel.module';

async function bootstrap() {
  initializeTransactionalContext()

  const app = await NestFactory.create(ChannelModule);

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

  const port = process.env.PORT || CommonConstants.DEFAULT_PORT;
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
