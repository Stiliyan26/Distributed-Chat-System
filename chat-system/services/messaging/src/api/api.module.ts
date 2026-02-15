import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import databaseConfig from '@libs/shared/src/database/database.config';
import { SharedDatabaseModule } from '@libs/shared/src/database/database.module';

import { MessageController } from '../controllers/message.controller';
import { MessageProducerService } from '../queue/producer/message.producer.service';
import { MessageReadService } from '../services/message.read.service';
import { MessageEntity } from '../entities/message.entity';

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
  providers: [MessageProducerService, MessageReadService],
})
export class ApiModule { }
