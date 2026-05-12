import { Logger, RequestMethod } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { initializeTransactionalContext } from 'typeorm-transactional';

import { CommonConstants } from "@libs/shared/src/constants/common.constants";

import { MessageWorkerModule } from "./worker.module";

async function bootstrap() {
  initializeTransactionalContext();

  const app = await NestFactory.create(MessageWorkerModule);

  const globalPrefix = CommonConstants.GLOBAL_PREFIX;
  app.setGlobalPrefix(globalPrefix, {
    exclude: [{ path: "health", method: RequestMethod.GET }],
  });

  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port);

  Logger.log(
    `messaging-worker started, consuming from Kafka; HTTP health at http://localhost:${port}/health (API prefix /${globalPrefix})`,
  );
}

bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  Logger.error(`Application failed to start: ${message}`, stack);
  process.exit(1);
});