import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('channels')
export class ChannelEntity {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    channelName: string;

    @Column({ type: 'uuid' })
    creatorId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}