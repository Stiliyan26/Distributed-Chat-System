import { Logger } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import axios from "axios";
import { Server, Socket } from 'socket.io';

import { AuthHeader, CommonConstants, MessageRoutes } from '@libs/shared/src';
import { ChatEvents } from "./constants/chat.events";
import { SendMessageDto } from "./dto/send-message.dto";

@WebSocketGateway({
    transports: ['websocket'],
    cors: { origin: '*' }
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server

    private readonly logger = new Logger(ChatGateway.name);

    handleConnection(socket: Socket) {
        this.logger.log(`Client connected: ${socket.id}`);
    }

    handleDisconnect(socket: Socket) {
        this.logger.log(`Client disconnected: ${socket.id}`);
    }

    @SubscribeMessage(ChatEvents.JOIN_CHANNEL)
    handleJoinChannel(
        @MessageBody() channelId: string,
        @ConnectedSocket() socket: Socket
    ) {
        socket.join(channelId);
        this.logger.log(`Socket ${socket.id} joined channel ${channelId}`);
    }

    @SubscribeMessage(ChatEvents.SEND_MESSAGE)
    async handleSendMessage(
        @MessageBody() sendMessageDto: SendMessageDto,
        @ConnectedSocket() socket: Socket
    ) {
        const userId = socket.handshake.headers[AuthHeader.USER_ID] as string;

        const messagingServiceUrl = `${process.env.MESSAGING_SERVICE_URL}/${CommonConstants.GLOBAL_PREFIX}/${MessageRoutes.PREFIX}`;

        await axios.post(
            messagingServiceUrl,
            sendMessageDto,
            { headers: { [AuthHeader.USER_ID]: userId } }
        )
    }
}