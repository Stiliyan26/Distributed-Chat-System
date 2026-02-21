import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { ChannelEntity } from "./channel.entity";

import { ChannelRole, ChannelTable } from "../constants";

@Entity(ChannelTable.CHANNEL_MEMBERS)
@Index(['memberId', 'channelId'])
export class ChannelMemberEntity {

    @PrimaryColumn('uuid')
    channelId: string;

    @PrimaryColumn('uuid')
    memberId: string

    @Column({ default: ChannelRole.MEMBER })
    role: string;

    @CreateDateColumn()
    joinedAt: Date

    @ManyToOne(() => ChannelEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'channelId' })
    channel: ChannelEntity;
}