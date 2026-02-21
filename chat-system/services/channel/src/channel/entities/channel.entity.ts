import { generateId } from "@libs/shared/src/utils/id.util";
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

import { ChannelTable } from "../constants";

@Entity(ChannelTable.CHANNELS)
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