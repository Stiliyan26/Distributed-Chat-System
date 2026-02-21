import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';

import { ChannelService } from '../services/channel.service';

import { CreateChannelRequestDto } from '../dto/request/create-channel.request.dto';
import { ChannelMembersResponseDto } from '../dto/response/channel-members.response';
import { CreateChannelResponseDto } from '../dto/response/create-channel.response.dto';
import { UserChannelsResponseDto } from '../dto/response/user-channels.response.dto';

@Controller('channels')
export class ChannelController {

  constructor(private readonly channelService: ChannelService) { }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createChannelDto: CreateChannelRequestDto): Promise<CreateChannelResponseDto> {
    return this.channelService.create(createChannelDto);
  }

  @Get(':channelId/members')
  @HttpCode(HttpStatus.OK)
  getAllMembersByChannelId(@Param('channelId', ParseUUIDPipe) channelId: string): Promise<ChannelMembersResponseDto> {
    return this.channelService.getAllMembersByChannelId(channelId)
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  getAllChannelsByUserId(@Param('userId', ParseUUIDPipe) userId: string): Promise<UserChannelsResponseDto> {
    return this.channelService.getAllChannelsByUserId(userId);
  }
}
