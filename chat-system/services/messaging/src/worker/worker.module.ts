import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import databaseConfig from '@libs/shared/src/database/database.config';
import { SharedDatabaseModule } from '@libs/shared/src/database/database.module';

import { MessageEntity } from "../entities/message.entity";
import { MessageConsumerService } from "../queue/consumer/message.consumer.service";
import { MessagePersistenceService } from "../services/message.persistence.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig]
    }),
    SharedDatabaseModule,
    TypeOrmModule.forFeature([MessageEntity])
  ],
  providers: [MessageConsumerService, MessagePersistenceService],
  exports: [],
})
export class MessageWorkerModule { }