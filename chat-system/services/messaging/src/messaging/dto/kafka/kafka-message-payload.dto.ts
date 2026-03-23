export interface KafkaMessagePayloadDto {
    channelId: string;
    senderId: string;
    senderUsername: string;
    content: string;
    sentAt: Date;
}
