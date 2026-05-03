import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { ChannelRoutes } from '@libs/shared/src/constants/routes.constants';
import { ChannelService } from './channel.service';

import { AddChannelMemberRequestDto } from './dto/request/add-channel-member.request.dto';
import { CreateChannelRequestDto } from './dto/request/create-channel.request.dto';
import { GetChannelMembersResponseDto } from './dto/response/get-channel-members.response.dto';
import { CreateChannelResponseDto } from './dto/response/create-channel.response.dto';
import { GetUserChannelsResponseDto } from './dto/response/get-user-channels.response.dto';

import { CurrentUserId } from '@libs/shared/src/decorators/current-user-id.decorator';

@Controller(ChannelRoutes.PREFIX)
export class ChannelController {

  constructor(private readonly channelService: ChannelService) { }

  @Get(ChannelRoutes.MEMBERS)
  @HttpCode(HttpStatus.OK)
  getAllMembersByChannelId(
    @Param('channelId', ParseUUIDPipe) channelId: string
  ): Promise<GetChannelMembersResponseDto> {
    return this.channelService.getAllMembersByChannelId(channelId);
  }

  @Post(ChannelRoutes.MEMBERS)
  @HttpCode(HttpStatus.CREATED)
  addMember(
    @Param('channelId', ParseUUIDPipe) channelId: string,
    @Body() addChannelMemberRequestDto: AddChannelMemberRequestDto,
    @CurrentUserId() requesterId: string
  ): Promise<void> {
    return this.channelService.addMember(channelId, addChannelMemberRequestDto, requesterId);
  }

  @Get(ChannelRoutes.USER_CHANNELS)
  @HttpCode(HttpStatus.OK)
  getAllChannelsByUserId(
    @CurrentUserId() userId: string
  ): Promise<GetUserChannelsResponseDto> {
    return this.channelService.getAllChannelsByUserId(userId);
  }

  @Post(ChannelRoutes.CREATE)
  @HttpCode(HttpStatus.CREATED)
  createChannel(
    @Body() createChannelRequestDto: CreateChannelRequestDto,
    @CurrentUserId() userId: string
  ): Promise<CreateChannelResponseDto> {
    return this.channelService.create(createChannelRequestDto, userId);
  }
}
