import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { initializeTransactionalContext } from 'typeorm-transactional';
import { MessageWorkerModule } from "./worker.module";

async function bootstrap() {
  initializeTransactionalContext();

  const app = await NestFactory.createApplicationContext(MessageWorkerModule);
  app.enableShutdownHooks();

  Logger.log('messaging-worker started, consuming from Kafka...');
}

bootstrap();