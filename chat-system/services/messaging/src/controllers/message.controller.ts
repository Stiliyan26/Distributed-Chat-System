import { Body, Controller, Get, HttpCode, HttpStatus, ParseUUIDPipe, Post, Query } from "@nestjs/common";

import { MessageRoutes } from "@libs/shared/src";
import { CurrentUserId } from '@libs/shared/src/decorators/current-user.decorator';

import { MessageDto } from "../dto/request/message.dto";
import { MessageResponseDto } from "../dto/response/message.response.dto";
import { MessageProducerService } from "../queue/producer/message.producer.service";
import { MessageFetchService } from "../services/message.fetch.service";

@Controller(MessageRoutes.PREFIX)
export class MessageController {

  constructor(
    private readonly messageProducerService: MessageProducerService,
    private readonly messageFetchService: MessageFetchService
  ) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllMessagesByChannel(
    @Query('channelId', ParseUUIDPipe) channelId: string
  ): Promise<MessageResponseDto[]> {
    return this.messageFetchService.getAllMessagesByChannel(channelId);
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async createMessage(
    @Body() messageDto: MessageDto,
    @CurrentUserId() senderId: string
  ): Promise<void> {
    return this.messageProducerService.publish(messageDto, senderId);
  }
}