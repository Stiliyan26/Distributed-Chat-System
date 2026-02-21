import { generateId } from "@libs/shared/src/utils/id.util";
import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity('messages')
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

  @Column({ type: 'timestamp with time zone' })
  sentAt: Date;
}