import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { GlobalExceptionFilter } from '@libs/shared/src/filters/global-exception.filter';

import { CommonConstants } from '@libs/shared/src/constants/common.constants';
import { DeliveryModule } from './delivery/delivery.module';

async function bootstrap() {
  const app = await NestFactory.create(DeliveryModule);

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true, // strips properties not in DTO
      forbidNonWhitelisted: true, // throws error on extra props
    }));

  const globalPrefix = CommonConstants.GLOBAL_PREFIX;
  app.setGlobalPrefix(globalPrefix, {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  app.enableShutdownHooks();

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
