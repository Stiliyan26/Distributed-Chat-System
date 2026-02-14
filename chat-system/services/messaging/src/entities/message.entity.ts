import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('messages')
@Index(['channelId'])
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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