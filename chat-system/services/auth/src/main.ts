import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

  app.use(cookieParser())

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
