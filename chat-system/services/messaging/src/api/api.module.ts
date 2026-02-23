import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import databaseConfig from '@libs/shared/src/database/database.config';
import { SharedDatabaseModule } from '@libs/shared/src/database/database.module';
import { UserHeaderGuard } from '@libs/shared/src/guards/user-header.guard';

import { MessageController } from '../controllers/message.controller';
import { MessageEntity } from '../entities/message.entity';
import { MessageProducerService } from '../queue/producer/message.producer.service';
import { MessageFetchService } from '../services/message.fetch.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig]
    }),
    SharedDatabaseModule,
    TypeOrmModule.forFeature([MessageEntity])
  ],
  controllers: [MessageController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: UserHeaderGuard
    },
    MessageProducerService,
    MessageFetchService
  ],
})
export class ApiModule { }
