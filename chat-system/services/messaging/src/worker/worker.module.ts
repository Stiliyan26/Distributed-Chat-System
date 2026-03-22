import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";


import databaseConfig from '@libs/shared/src/database/database.config';
import { SharedDatabaseModule } from '@libs/shared/src/database/database.module';

import { MessagingWorkerDomainModule } from "../messaging/messaging.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig]
    }),
    SharedDatabaseModule,
    MessagingWorkerDomainModule,
  ],
})
export class MessageWorkerModule { }