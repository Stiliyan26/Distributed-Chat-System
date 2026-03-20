import { Inject, Logger, OnModuleInit } from "@nestjs/common";
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";

import { REDIS_CLIENT } from "@libs/shared/src/constants/redis.constants";
import axios from "axios";
import Redis from "ioredis";
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
export class ChatGateway implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect {

    private readonly sendMessageUrl = `${process.env.MESSAGING_SERVICE_URL}/${CommonConstants.GLOBAL_PREFIX}/${MessageRoutes.PREFIX}`;

    private readonly presenceCommon = `${process.env.PRESENCE_SERVICE_URL}/${CommonConstants.GLOBAL_PREFIX}/${PresenceRoutes.PREFIX}`;

    private readonly presenceOnlineUrl = `${this.presenceCommon}/${PresenceRoutes.ONLINE}`;
    private readonly presenceOfflineUrl = `${this.presenceCommon}/${PresenceRoutes.OFFLINE}`;
    private readonly presenceHeartbeatUrl = `${this.presenceCommon}/${PresenceRoutes.HEARTBEAT}`;

    private readonly heartbeatInterval = 20_000;

    @WebSocketServer()
    server: Server

    private readonly logger = new Logger(ChatGateway.name);

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redisService: Redis
    ) { }

    onModuleInit() {
        this.redisService.on('message', (channel: string, message: string) => {
            const channelPrefix = 'channel:';

            if (!channel.startsWith(channelPrefix)) {
                return;
            }

            const channelId = channel.substring(channelPrefix.length);

            try {
                const parsedMessage = JSON.parse(message);
                const socketIds = Array.from(this.server.sockets.adapter.rooms.get(channelId) || []);
                this.logger.log(`[ChatGateway] Distributing message from Redis -> Channel ${channelId}, Active Sockets: ${JSON.stringify(socketIds)} | Message: ${JSON.stringify(parsedMessage)}`);
                this.server.to(channelId).emit(ChatEvents.NEW_MESSAGE, parsedMessage);
            } catch (error: any) {
                this.logger.error(`Failed to push message: ${error.message}`);
            }
        });
    }

    async handleConnection(socket: Socket) {
        this.updatePresenceStatus(this.presenceOnlineUrl, socket);

        socket.data.heartbeatId = setInterval(() => {
            this.updatePresenceStatus(this.presenceHeartbeatUrl, socket);
        }, this.heartbeatInterval);

        this.logger.log(`Client connected: ${socket.id}`);
    }

    async handleDisconnect(socket: Socket) {
        clearInterval(socket.data.heartbeatId);

        const channelsToUnsubscribe: string[] = [];

        // All the channels this socket is in, ignoring its own private ID room
        const activeChannelIds = Array.from(socket.rooms)
            .filter(room => room != socket.id);

        for (const channelId of activeChannelIds) {
            const socketInRoom = this.server.sockets.adapter.rooms.get(channelId)?.size || 0;

            // If the size is 1, this disconnecting socket is the absolute last one in the room!
            if (socketInRoom <= 1) {
                channelsToUnsubscribe.push(`channel:${channelId}`);
            }
        }

        if (channelsToUnsubscribe.length > 0) {
            await this.redisService.unsubscribe(...channelsToUnsubscribe);
            this.logger.log(`Unsubscribed from ${channelsToUnsubscribe.length} empty channels`);
        }

        this.updatePresenceStatus(this.presenceOfflineUrl, socket);

        this.logger.log(`Client disconnected: ${socket.id}`);
    }

    @SubscribeMessage(ChatEvents.JOIN_ALL_USER_CHANNELS)
    async handleAllUserChannelMemberships(
        @MessageBody() channelIds: string[],
        @ConnectedSocket() socket: Socket
    ) {
        if (!channelIds || channelIds.length === 0) {
            return;
        }

        socket.join(channelIds);
        this.logger.log(`Socket ${socket.id} joined ${channelIds.length} channels`);

        const channels = channelIds.map(id => `channel:${id}`);
        await this.redisService.subscribe(...channels);
    }

    @SubscribeMessage(ChatEvents.SEND_MESSAGE)
    async handleSendMessage(
        @MessageBody() sendMessageDto: SendMessageDto,
        @ConnectedSocket() socket: Socket
    ) {
        const userId = socket.handshake.headers[AuthHeader.USER_ID] as string;

        this.logger.log(`[ChatService] Forwarding message to Messaging Service. UserId: ${userId}, ChannelId: ${sendMessageDto.channelId}, Message: "${sendMessageDto.content}"`);

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