export interface KafkaMessagePayload {
    channelId: string;
    senderId: string;
    senderUsername: string;
    content: string;
    sentAt: Date;
}
