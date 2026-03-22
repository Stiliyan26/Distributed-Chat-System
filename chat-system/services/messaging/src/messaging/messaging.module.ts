import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MessageController } from './message.controller';
import { MessageFetchService } from './message.fetch.service';
import { MessagePersistenceService } from './message.persistence.service';
import { MessageProducerService } from './queue/producer/message.producer.service';
import { MessageConsumerService } from './queue/consumer/message.consumer.service';
import { MessageEntity } from './entities/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity])],
  exports: [TypeOrmModule],
})
export class MessagingCoreModule { }

@Module({
  imports: [MessagingCoreModule],
  controllers: [MessageController],
  providers: [
    MessageFetchService,
    MessageProducerService,
  ],
  exports: [
    MessageFetchService,
    MessageProducerService,
  ],
})
export class MessagingApiModule { }

@Module({
  imports: [MessagingCoreModule],
  providers: [
    MessagePersistenceService,
    MessageConsumerService,
  ],
  exports: [
    MessagePersistenceService,
    MessageConsumerService,
  ],
})
export class MessagingWorkerDomainModule { }
