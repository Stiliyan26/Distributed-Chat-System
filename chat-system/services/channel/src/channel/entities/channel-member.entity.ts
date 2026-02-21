import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { ChannelEntity } from "./channel.entity";

@Entity('channel_members')
@Index(['memberId', 'channelId'])
export class ChannelMemberEntity {

    @PrimaryColumn('uuid')
    channelId: string;

    @PrimaryColumn('uuid')
    memberId: string

    @Column({ default: 'member' })
    role: string;

    @CreateDateColumn()
    joinedAt: Date

    @ManyToOne(() => ChannelEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'channelId' })
    channel: ChannelEntity;
}