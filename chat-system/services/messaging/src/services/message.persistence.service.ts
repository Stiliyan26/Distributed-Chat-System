import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { KafkaMessagePayload } from "../dto/kafka/kafka-message.payload";
import { MessageEntity } from "../entities/message.entity";

@Injectable()
export class MessagePersistenceService {

  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>
  ) { }

  async save(payload: KafkaMessagePayload): Promise<MessageEntity> {
    const messageEntity = this.messageRepo.create(payload);

    return await this.messageRepo.save(messageEntity);
  }
}