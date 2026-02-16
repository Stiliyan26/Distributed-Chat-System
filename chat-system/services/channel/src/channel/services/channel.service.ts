import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

import { ChannelEntity } from '../entities/channel.entity';
import { CreateChannelDto } from '../dto/request/create-channel.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ChannelService {

  constructor(
    @InjectRepository(ChannelEntity)
    private readonly channelRepo: Repository<ChannelEntity>
  ) {}

  async create(createChannelDto: CreateChannelDto) {
    const channelEntity = this.channelRepo.create(createChannelDto);

    return this.channelRepo.save(channelEntity);
  }
}
