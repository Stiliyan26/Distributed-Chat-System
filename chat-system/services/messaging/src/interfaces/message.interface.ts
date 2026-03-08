import { MessagePayload } from '@libs/shared/src/interfaces/message-payload.interface';

export type PublishMessageResponse = {
    success: string;
};

export interface DeliveryRequest {
    channelId: string;
    offlineUserIds: string[];
    message: MessagePayload;
}
