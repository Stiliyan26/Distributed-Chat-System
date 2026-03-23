import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { MessageEntity } from "./entities/message.entity";
import { GetMessagesResponseDto } from "./dto/response/get-messages.response.dto";

@Injectable()
export class MessageFetchService {

  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>
  ) { }

  async getAllMessagesByChannel(channelId: string): Promise<GetMessagesResponseDto[]> {
    const messages = await this.messageRepository.find({
      where: { channelId },
      order: { sentAt: 'ASC' }
    });

    return messages.map(GetMessagesResponseDto.fromEntity);
  }
}