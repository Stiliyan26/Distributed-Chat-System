import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { initializeTransactionalContext } from 'typeorm-transactional';

import cookieParser from 'cookie-parser';

import { CommonConstants } from '@libs/shared/src';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule);
  const globalPrefix = CommonConstants.GLOBAL_PREFIX;

  app.setGlobalPrefix(globalPrefix);
  app.enableCors({
    origin: true,
    credentials: true // Allows cookies to be sent
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true, // strips properties not in DTO
    forbidNonWhitelisted: true, // throws error on extra props
  }));

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.use(cookieParser())

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
