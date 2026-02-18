import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import cookieParser from 'cookie-parser';

import { AuthModule } from './auth.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  const globalPrefix = 'api';

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
