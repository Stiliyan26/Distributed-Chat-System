import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

import { GlobalExceptionFilter } from '@libs/shared/src/filters/global-exception.filter';


import { ApiGatewayModule } from './api-gateway.module';
import { ChatProxyMiddleware } from './proxy/middleware/chat-proxy.middleware';

async function bootstrap() {
  const bodyLimit = process.env.GATEWAY_BODY_LIMIT || '512kb';

  const app = await NestFactory.create(ApiGatewayModule, {
    bodyParser: false,
  });

  const globalPrefix = 'api';

  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));
  app.use(cookieParser());

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.setGlobalPrefix(globalPrefix);

  app.enableShutdownHooks();

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

bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  Logger.error(`Application failed to start: ${message}`, stack);
  process.exit(1);
});
