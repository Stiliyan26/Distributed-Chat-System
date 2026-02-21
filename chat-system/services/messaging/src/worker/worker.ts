import { NestFactory } from "@nestjs/core";
import { initializeTransactionalContext } from 'typeorm-transactional';
import { MessageWorkerModule } from "./worker.module";

async function bootstrap() {
  initializeTransactionalContext();

  const app = await NestFactory.createApplicationContext(MessageWorkerModule);
  console.log('messaging-worker started, consuming from Kafka...');
}

bootstrap();