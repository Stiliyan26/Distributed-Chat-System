import { NestFactory } from "@nestjs/core";
import { MessageWorkerModule } from "./worker.module";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(MessageWorkerModule);
  console.log('messaging-worker started, consuming from Kafka...');
}

bootstrap();