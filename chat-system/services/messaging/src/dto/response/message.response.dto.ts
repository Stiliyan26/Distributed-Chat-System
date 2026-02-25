import { MessageEntity } from '../../entities/message.entity';

export class MessageResponseDto {
    channelId: string;
    senderId: string;
    senderUsername: string;
    content: string;
    sentAt: Date;

    static fromEntity(entity: MessageEntity): MessageResponseDto {
        const dto = new MessageResponseDto();
        dto.channelId = entity.channelId;
        dto.senderId = entity.senderId;
        dto.senderUsername = entity.senderUsername;
        dto.content = entity.content;
        dto.sentAt = entity.sentAt;
        return dto;
    }
}
