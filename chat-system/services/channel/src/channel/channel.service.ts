import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { ChannelError, ChannelRole } from './constants/channel.constants';
import { CreateChannelRequestDto } from './dto/request/create-channel.request.dto';
import { CreateChannelResponseDto } from './dto/response/create-channel.response.dto';
import { GetChannelMembersResponseDto } from './dto/response/get-channel-members.response.dto';
import { GetUserChannelsResponseDto } from './dto/response/get-user-channels.response.dto';
import { ChannelMemberEntity } from './entities/channel-member.entity';
import { ChannelEntity } from './entities/channel.entity';

@Injectable()
export class ChannelService {

  constructor(
    @InjectRepository(ChannelEntity)
    private readonly channelRepository: Repository<ChannelEntity>,
    @InjectRepository(ChannelMemberEntity)
    private readonly channelMemberRepository: Repository<ChannelMemberEntity>
  ) { }

  @Transactional()
  async create(
    createChannelRequestDto: CreateChannelRequestDto,
    creatorId: string
  ): Promise<CreateChannelResponseDto> {
    const { channelName, memberIds } = createChannelRequestDto;

    const savedChannel = await this.createChannel(channelName, creatorId);

    const uniqueMemberIds = this.getUniqueMemberIds(memberIds, creatorId);

    await this.createChannelMembers(savedChannel.id, uniqueMemberIds, creatorId);

    return {
      channelId: savedChannel.id,
      channelName: savedChannel.channelName,
      memberIds: uniqueMemberIds
    };
  }

  async getAllMembersByChannelId(channelId: string): Promise<GetChannelMembersResponseDto> {
    const members = await this.channelMemberRepository.find({
      where: { channelId },
      select: ['memberId']
    });

    if (!members.length) {
      throw new NotFoundException(ChannelError.NOT_FOUND);
    }

    return {
      memberIds: members.map(m => m.memberId)
    };
  }

  async getAllChannelsByUserId(userId: string): Promise<GetUserChannelsResponseDto> {
    const memberships = await this.channelMemberRepository.find({
      where: { memberId: userId },
      relations: ['channel'],
      select: {
        channelId: true,
        memberId: true,
        channel: {
          id: true,
          channelName: true
        }
      }
    });

    return memberships.map(m => ({
      channelId: m.channel.id,
      channelName: m.channel.channelName
    }));
  }

  private async createChannel(channelName: string, creatorId: string): Promise<ChannelEntity> {
    const channel = this.channelRepository.create({
      channelName,
      creatorId
    });

    return await this.channelRepository.save(channel);
  }

  private getUniqueMemberIds(memberIds: string[], creatorId: string) {
    return Array.from(new Set([...memberIds, creatorId]));
  }

  private async createChannelMembers(channelId: string, memberIds: string[], creatorId: string): Promise<void> {
    const channelMembers = memberIds.map((memberId) => {
      const role = creatorId === memberId
        ? ChannelRole.ADMIN
        : ChannelRole.MEMBER;

      return {
        channelId,
        memberId,
        role
      };
    });

    await this.channelMemberRepository.insert(channelMembers);
  }
}
