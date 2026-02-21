import { DbConstants } from "@libs/shared/src";
import { generateId } from "@libs/shared/src/utils/id.util";
import { Column, Entity, Index, PrimaryColumn } from "typeorm";

import { MessageTable } from "../constants";

@Entity(MessageTable.MESSAGES)
@Index(['channelId'])
export class MessageEntity {

  @PrimaryColumn('uuid')
  id: string = generateId();

  @Column()
  channelId: string;

  @Column()
  senderId: string;

  @Column()
  senderUsername: string;

  @Column('text')
  content: string;

  @Column({ type: DbConstants.TIMESTAMP_WITH_TIMEZONE })
  sentAt: Date;
}