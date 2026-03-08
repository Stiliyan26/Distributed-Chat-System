import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { ApiGatewayModule } from './api-gateway.module';
import { ChatProxyMiddleware } from './proxy/middleware/chat-proxy.middleware';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const globalPrefix = 'api';

  app.use(cookieParser());

  app.setGlobalPrefix(globalPrefix);

  const port = process.env.PORT || 3000;
  const server = await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );

  const chatProxyMiddleware = app.get(ChatProxyMiddleware);

  server.on('upgrade', (req, socket, head) => {
    chatProxyMiddleware.proxy.upgrade(req, socket, head);
  });
}

bootstrap();
