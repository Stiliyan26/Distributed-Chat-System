import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { MessageEntity } from "../entities/message.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class MessageReadService {

  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>
  ) { }

  async getAllMessagesByChannel(channelId: string) {
    return this.messageRepo.find({
      where: { channelId }
    })
  }
}