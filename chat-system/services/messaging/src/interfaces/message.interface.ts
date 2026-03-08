export type PublishMessageResponse = {
    success: string;
};

export interface MessagePayload {
    content: string;
    senderId: string;
    senderUsername: string;
    sentAt: Date;
}

export interface DeliveryRequest {
    channelId: string;
    offlineUserIds: string[];
    message: MessagePayload;
}
