import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { KafkaMessagePayloadDto } from "./dto/kafka/kafka-message-payload.dto";
import { MessageEntity } from "./entities/message.entity";

@Injectable()
export class MessagePersistenceService {

  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>
  ) { }

  async save(kafkaMessagePayloadDto: KafkaMessagePayloadDto): Promise<MessageEntity> {
    const message = this.messageRepo.create({
      channelId: kafkaMessagePayloadDto.channelId,
      senderId: kafkaMessagePayloadDto.senderId,
      senderUsername: kafkaMessagePayloadDto.senderUsername,
      content: kafkaMessagePayloadDto.content,
      sentAt: kafkaMessagePayloadDto.sentAt,
    });

    return await this.messageRepo.save(message);
  }
}