import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";


import databaseConfig from '@libs/shared/src/database/database.config';
import messagingConfig from '../config/messaging.config';
import { SharedDatabaseModule } from '@libs/shared/src/database/database.module';

import { MessagingWorkerDomainModule } from "../messaging/messaging.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, messagingConfig]
    }),
    SharedDatabaseModule,
    MessagingWorkerDomainModule,
  ],
})
export class MessageWorkerModule { }