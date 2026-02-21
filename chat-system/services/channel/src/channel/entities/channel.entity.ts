import { generateId } from "@libs/shared/src/utils/id.util";
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity('channels')
export class ChannelEntity {
    
    @PrimaryColumn('uuid')
    id: string = generateId();

    @Column()
    channelName: string;

    @Column({ type: 'uuid' })
    creatorId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}