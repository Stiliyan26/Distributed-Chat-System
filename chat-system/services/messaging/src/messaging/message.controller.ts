import { Body, Controller, Get, HttpCode, HttpStatus, ParseUUIDPipe, Post, Query } from "@nestjs/common";

import { MessageRoutes } from "@libs/shared/src/constants/routes.constants";
import { CurrentUserId } from '@libs/shared/src/decorators/current-user-id.decorator';

import { PublishMessageRequestDto } from "./dto/request/publish-message.request.dto";
import { GetMessagesResponseDto } from "./dto/response/get-messages.response.dto";
import { PublishMessageResponse } from './interfaces/message.interface';
import { MessageFetchService } from "./message.fetch.service";
import { MessageProducerService } from "./queue/producer/message.producer.service";

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
  ): Promise<GetMessagesResponseDto[]> {
    return this.messageFetchService.getAllMessagesByChannel(channelId);
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async createMessage(
    @Body() publishMessageRequestDto: PublishMessageRequestDto,
    @CurrentUserId() senderId: string
  ): Promise<PublishMessageResponse> {
    return this.messageProducerService.publish(publishMessageRequestDto, senderId);
  }
}