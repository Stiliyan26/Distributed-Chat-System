import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import databaseConfig from '@libs/shared/src/database/database.config';
import messagingConfig from '../config/messaging.config';
import { SharedDatabaseModule } from '@libs/shared/src/database/database.module';
import { UserHeaderGuard } from '@libs/shared/src/guards/user-header.guard';
import { HealthController } from '@libs/shared/src/health/health.controller';

import { MessagingApiModule } from '../messaging/messaging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, messagingConfig]
    }),
    SharedDatabaseModule,
    MessagingApiModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: UserHeaderGuard
    },
  ],
})
export class ApiModule { }
