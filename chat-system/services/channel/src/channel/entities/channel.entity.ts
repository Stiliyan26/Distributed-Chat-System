import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('channels')
export class ChannelEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    channelName: string;

    @Column('simple-array')
    members: string[];

    @Column({ type: 'uuid' })
    creatorId: string;

    @CreateDateColumn()
    createdAt: Date;
}