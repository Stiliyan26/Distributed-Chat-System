import { Body, Controller, Get, HttpCode, HttpStatus, ParseUUIDPipe, Post, Query } from "@nestjs/common";

import { MessageDto } from "../dto/request/message.dto";
import { MessageProducerService } from "../queue/producer/message.producer.service";
import { MessageReadService } from "../services/message.read.service";


@Controller('messages')
export class MessageController {

  constructor(
    private readonly messageProducerService: MessageProducerService,
    private readonly messageReadService: MessageReadService
  ) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  async get(@Query('channelId', ParseUUIDPipe) channelId: string) {
    return this.messageReadService.getAllMessagesByChannel(channelId);
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(@Body() messageDto: MessageDto) {
    return this.messageProducerService.publish(messageDto);
  }
}