import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';

import { ChannelError, ChannelRole } from '../constants';
import { CreateChannelRequestDto } from '../dto/request/create-channel.request.dto';
import { ChannelMembersResponseDto } from '../dto/response/channel-members.response';
import { CreateChannelResponseDto } from '../dto/response/create-channel.response.dto';
import { UserChannelsResponseDto } from '../dto/response/user-channels.response.dto';
import { ChannelMemberEntity } from '../entities/channel-member.entity';
import { ChannelEntity } from '../entities/channel.entity';

@Injectable()
export class ChannelService {

  constructor(
    @InjectRepository(ChannelEntity)
    private readonly channelRepository: Repository<ChannelEntity>,
    @InjectRepository(ChannelMemberEntity)
    private readonly channelMemberRepository: Repository<ChannelMemberEntity>
  ) { }

  @Transactional()
  async create(createChannelDto: CreateChannelRequestDto): Promise<CreateChannelResponseDto> {
    const { channelName, memberIds, creatorId } = createChannelDto;

    const savedChannel = await this.createChannel(channelName, creatorId);

    const uniqueMemberIds = this.getUniqueMmeberIds(memberIds, creatorId);

    await this.createChannelMembers(savedChannel.id, uniqueMemberIds, creatorId);

    return {
      channelId: savedChannel.id,
      channelName: savedChannel.channelName,
      memberIds: uniqueMemberIds
    };
  }

  async getAllMembersByChannelId(channelId: string): Promise<ChannelMembersResponseDto> {
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

  async getAllChannelsByUserId(userId: string): Promise<UserChannelsResponseDto> {
    const memberships = await this.channelMemberRepository.find({
      where: { memberId: userId },
      select: ['channelId']
    });

    if (!memberships.length) {
      return [];
    }

    const channelIds = memberships.map(m => m.channelId);

    const channels = await this.channelRepository.findBy({ id: In(channelIds) });

    return channels.map(c => ({
      channelId: c.id,
      channelName: c.channelName
    }));
  }

  private async createChannel(channelName: string, creatorId: string): Promise<ChannelEntity> {
    const channel = this.channelRepository.create({
      channelName,
      creatorId
    });

    return await this.channelRepository.save(channel);
  }

  private getUniqueMmeberIds(memberIds: string[], creatorId: string) {
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
