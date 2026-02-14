import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";

import { MessageDto } from "../dto/request/message.dto";
import { MessageProducerService } from "../queue/producer/message.producer.service";


@Controller('messages')
export class MessageController {

  constructor(private messageProducerService: MessageProducerService) { }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(@Body() messageDto: MessageDto) {
    return this.messageProducerService.publish(messageDto);
  }
}