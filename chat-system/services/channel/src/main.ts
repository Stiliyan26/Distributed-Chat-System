import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { initializeTransactionalContext } from 'typeorm-transactional';

import { GlobalExceptionFilter } from '@libs/shared/src/filters/global-exception.filter';

import { CommonConstants } from "@libs/shared/src/constants/common.constants";
import { ChannelModule } from './channel/channel.module';

async function bootstrap() {
  initializeTransactionalContext()

  const app = await NestFactory.create(ChannelModule);
  
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

  const configService = app.get(ConfigService);
  const port = configService.get<number>('channel.port');
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
