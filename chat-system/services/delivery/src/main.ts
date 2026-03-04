import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { DeliveryModule } from './delivery/delivery.module';

async function bootstrap() {
  const app = await NestFactory.create(DeliveryModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true, // strips properties not in DTO
      forbidNonWhitelisted: true, // throws error on extra props
    }));

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
