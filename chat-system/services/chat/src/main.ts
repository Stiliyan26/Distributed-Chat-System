import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ChatModule } from './chat/chat.module';

async function bootstrap() {
  const app = await NestFactory.create(ChatModule);
  const globalPrefix = 'api';

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

  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
