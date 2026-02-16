import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ChannelService } from '../services/channel.service';
import { CreateChannelDto } from '../dto/request/create-channel.dto';

@Controller('channel')
export class ChannelController {

  constructor(private readonly channelService: ChannelService) { }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createChannelDto: CreateChannelDto) {
    return this.channelService.create(createChannelDto);
  }
}
