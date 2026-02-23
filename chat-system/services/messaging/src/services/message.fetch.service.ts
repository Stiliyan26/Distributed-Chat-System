import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { MessageResponseDto } from "../dto/response/message.response.dto";
import { MessageEntity } from "../entities/message.entity";

@Injectable()
export class MessageFetchService {

  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>
  ) { }

  async getAllMessagesByChannel(channelId: string): Promise<MessageResponseDto[]> {
    const messages = await this.messageRepository.find({
      where: { channelId }
    });

    return messages.map(MessageResponseDto.fromEntity);
  }
}