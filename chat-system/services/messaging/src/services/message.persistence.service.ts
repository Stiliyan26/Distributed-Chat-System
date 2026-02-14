import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { MessageDto } from "../dto/request/message.dto";
import { MessageEntity } from "../entities/message.entity";

@Injectable()
export class MessagePersistenceService {

  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>
  ) { }

  async save(messageDto: MessageDto): Promise<MessageEntity> {
    const messageEntity = this.messageRepo.create(messageDto);

    return await this.messageRepo.save(messageEntity);
  }
}