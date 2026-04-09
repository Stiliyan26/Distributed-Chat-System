import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import axios from 'axios';

import { GlobalExceptionFilter } from '@libs/shared/src/filters/global-exception.filter';

import { CommonConstants } from '@libs/shared/src/constants/common.constants';
import { ChatModule } from './chat/chat.module';

axios.defaults.timeout = 5000;

async function bootstrap() {
  const app = await NestFactory.create(ChatModule);

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

  app.useWebSocketAdapter(new IoAdapter(app));

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
