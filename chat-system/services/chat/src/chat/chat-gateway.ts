import { Logger } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";

import axios from "axios";
import { Server, Socket } from 'socket.io';

import { AuthHeader } from '@libs/shared/src/constants/auth.constants';
import { CommonConstants } from '@libs/shared/src/constants/common.constants';
import { MessageRoutes, PresenceRoutes } from '@libs/shared/src/constants/routes.constants';
import { ChatEvents } from "./constants/chat.events";
import { SendMessageDto } from "./dto/send-message.dto";

@WebSocketGateway({
    transports: ['websocket'],
    cors: { origin: '*' }
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {

    private readonly sendMessageUrl = `${process.env.MESSAGING_SERVICE_URL}/${CommonConstants.GLOBAL_PREFIX}/${MessageRoutes.PREFIX}`;

    private readonly presenceCommon = `${process.env.PRESENCE_SERVICE_URL}/${CommonConstants.GLOBAL_PREFIX}/${PresenceRoutes.PREFIX}`;

    private readonly presenceOnlineUrl = `${this.presenceCommon}/${PresenceRoutes.ONLINE}`;
    private readonly presenceOfflineUrl = `${this.presenceCommon}/${PresenceRoutes.OFFLINE}`;
    private readonly presenceHeartbeatUrl = `${this.presenceCommon}/${PresenceRoutes.HEARTBEAT}`;

    private readonly heartbeatInterval = 20_000;

    @WebSocketServer()
    server: Server

    private readonly logger = new Logger(ChatGateway.name);

    async handleConnection(socket: Socket) {
        this.updatePresenceStatus(this.presenceOnlineUrl, socket);

        socket.data.heartbeatId = setInterval(() => {
            this.updatePresenceStatus(this.presenceHeartbeatUrl, socket);
        }, this.heartbeatInterval);

        this.logger.log(`Client connected: ${socket.id}`);
    }

    async handleDisconnect(socket: Socket) {
        clearInterval(socket.data.heartbeatId);

        this.updatePresenceStatus(this.presenceOfflineUrl, socket);

        this.logger.log(`Client disconnected: ${socket.id}`);
    }

    @SubscribeMessage(ChatEvents.SEND_MESSAGE)
    async handleSendMessage(
        @MessageBody() sendMessageDto: SendMessageDto,
        @ConnectedSocket() socket: Socket
    ) {
        const userId = socket.handshake.headers[AuthHeader.USER_ID] as string;

        await axios.post(
            this.sendMessageUrl,
            sendMessageDto,
            { headers: { [AuthHeader.USER_ID]: userId } }
        );
    }

    private async updatePresenceStatus(endpointUrl: string, socket: Socket) {
        const userId = socket.handshake.headers[AuthHeader.USER_ID] as string;

        try {
            await axios.post(
                endpointUrl,
                { socketId: socket.id },
                { headers: { [AuthHeader.USER_ID]: userId } }
            );
        } catch (error: any) {
            this.logger.error(`Failed to update presence at ${endpointUrl}: ${error?.message}`);
        }
    }
}