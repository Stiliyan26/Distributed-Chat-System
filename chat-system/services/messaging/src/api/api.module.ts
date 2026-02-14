import { Module } from '@nestjs/common';

import { MessageController } from '../controllers/message.controller';
import { MessageProducerService } from '../queue/producer/message.producer.service';


@Module({
  imports: [],
  controllers: [MessageController],
  providers: [MessageProducerService],
})
export class ApiModule { }
