import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('channels')
export class ChannelEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    channelName: string;

    @Column('simple-array')
    members: string[];

    @Column()
    creatorName: string;

    @CreateDateColumn()
    createdAt: Date;
}