import { Inject, Logger, OnModuleInit, UsePipes, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
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

import { AuthCookie, AuthHeader } from '@libs/shared/src/constants/auth.constants';
import { CommonConstants } from '@libs/shared/src/constants/common.constants';
import { MessageRoutes, PresenceRoutes } from '@libs/shared/src/constants/routes.constants';

import { CHAT_CONFIG_KEY, ChatConfig } from "../config/chat.config";
import { ChatEvents } from "./constants/chat-events.constants";
import { JoinChannelDto } from "./dto/join-channel.dto";
import { SendMessageRequestDto } from "./dto/send-message.request.dto";

@UsePipes(new ValidationPipe())
@WebSocketGateway({
    transports: ['websocket'],
    cors: { origin: '*' }
})
export class ChatGateway implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect {

    private get chatConfig() {
        return this.configService.get(CHAT_CONFIG_KEY, { infer: true })!;
    }

    private get messagingServiceUrl() {
        return this.chatConfig.services.messagingUrl;
    }

    private get presenceServiceUrl() {
        return this.chatConfig.services.presenceUrl;
    }

    private get sendMessageUrl() {
        return `${this.messagingServiceUrl}/${CommonConstants.GLOBAL_PREFIX}/${MessageRoutes.PREFIX}`;
    }

    private get presenceCommon() {
        return `${this.presenceServiceUrl}/${CommonConstants.GLOBAL_PREFIX}/${PresenceRoutes.PREFIX}`;
    }

    private get presenceOnlineUrl() {
        return `${this.presenceCommon}/${PresenceRoutes.ONLINE}`;
    }

    private get presenceOfflineUrl() {
        return `${this.presenceCommon}/${PresenceRoutes.OFFLINE}`;
    }

    private get presenceHeartbeatUrl() {
        return `${this.presenceCommon}/${PresenceRoutes.HEARTBEAT}`;
    }

    private readonly heartbeatInterval = 20_000;
    private readonly heartbeatMaxFailures = 3;

    private readonly CHANNEL_PREFIX = 'channel:';
    private readonly DLQ_FAILED_MESSAGES = 'dlq:chat:failed_messages';

    @WebSocketServer()
    server: Server

    private readonly logger = new Logger(ChatGateway.name);

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redisClient: Redis,
        private readonly configService: ConfigService<{ [CHAT_CONFIG_KEY]: ChatConfig }>,
        private readonly jwtService: JwtService,
    ) { }

    onModuleInit() {
        this.redisClient.on('message', async (channel: string, message: string) => {
            if (!channel.startsWith(this.CHANNEL_PREFIX)) {
                return;
            }

            const channelId = channel.substring(this.CHANNEL_PREFIX.length);

            try {
                const parsedMessage = JSON.parse(message) as Record<string, unknown>;
                const socketIds = Array.from(this.server.sockets.adapter.rooms.get(channelId) || []);

                const payload = {
                    ...parsedMessage,
                    channelId,
                };

                this.logger.log(`[ChatGateway] Distributing message from Redis -> Channel ${channelId}, Active Sockets: ${JSON.stringify(socketIds)} | Message: ${JSON.stringify(payload)}`);

                this.server.to(channelId).emit(ChatEvents.NEW_MESSAGE, payload);
            } catch (error: any) {
                this.logger.error(
                    `Failed to parse/push message. Channel: ${channelId}, Raw Message: ${message}, Error: ${error.message}`
                );

                try {
                    // Replace with kafka or some other durable log
                    await this.redisClient.lpush(
                        this.DLQ_FAILED_MESSAGES,
                        JSON.stringify({
                            timestamp: new Date().toISOString(),
                            channel: channelId,
                            rawContent: message,
                            error: error.message
                        })
                    );
                } catch (dlqError: any) {
                    this.logger.error(`Failed to push to DLQ: ${dlqError.message}`);
                }
            }
        });
    }

    async handleConnection(socket: Socket) {
        const userId = this.resolveSocketUserId(socket);

        if (!userId) {
            this.logger.warn(`[ChatGateway] Missing user identity — disconnecting socket ${socket.id}`);
            socket.disconnect();
            return;
        }

        socket.data.userId = userId;

        const isPresenceTracked = await this.updatePresenceStatus(this.presenceOnlineUrl, socket);

        if (!isPresenceTracked) {
            this.logger.warn(`Disconnecting client ${socket.id} because initial presence update failed`);
            socket.disconnect();
            return;
        }

        socket.data.heartbeatFailures = 0;
        socket.data.heartbeatId = setInterval(async () => {
            const success = await this.updatePresenceStatus(this.presenceHeartbeatUrl, socket);

            if (!success) {
                socket.data.heartbeatFailures += 1;

                this.logger.warn(
                    `Heartbeat failed for socket ${socket.id} (${socket.data.heartbeatFailures}/${this.heartbeatMaxFailures})`
                );

                if (socket.data.heartbeatFailures >= this.heartbeatMaxFailures) {
                    this.logger.warn(
                        `Max heartbeat failures reached for socket ${socket.id}. Disconnecting.`
                    );

                    clearInterval(socket.data.heartbeatId);
                    socket.disconnect();
                }
            } else {
                // Reset on recovery so a brief blip doesn't accumulate
                socket.data.heartbeatFailures = 0;
            }
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
                channelsToUnsubscribe.push(`${this.CHANNEL_PREFIX}${channelId}`);
            }
        }

        if (channelsToUnsubscribe.length > 0) {
            try {
                await this.redisClient.unsubscribe(...channelsToUnsubscribe);
                this.logger.log(`Unsubscribed from ${channelsToUnsubscribe.length} empty channels`);
            } catch (err: any) {
                this.logger.error(
                    `Redis unsubscribe failed during disconnect (socket ${socket.id}, channels=${JSON.stringify(channelsToUnsubscribe)}): ${err?.message ?? err}`,
                    err?.stack,
                );
            }
        }

        this.updatePresenceStatus(this.presenceOfflineUrl, socket);

        this.logger.log(`Client disconnected: ${socket.id}`);
    }

    @SubscribeMessage(ChatEvents.JOIN_ALL_USER_CHANNELS)
    async handleAllUserChannelMemberships(
        @MessageBody() joinChannelDto: JoinChannelDto,
        @ConnectedSocket() socket: Socket
    ) {
        const { channelIds } = joinChannelDto;

        if (!channelIds || channelIds.length === 0) {
            return;
        }

        await this.ensureSocketSubscribedToChannels(socket, channelIds);
        this.logger.log(`Socket ${socket.id} joined ${channelIds.length} channels`);
    }

    @SubscribeMessage(ChatEvents.SEND_MESSAGE)
    async handleSendMessage(
        @MessageBody() sendMessageRequestDto: SendMessageRequestDto,
        @ConnectedSocket() socket: Socket
    ) {
        const userId = socket.data.userId as string;

        await this.ensureSocketSubscribedToChannels(socket, [sendMessageRequestDto.channelId]);

        this.logger.log(`[ChatService] Forwarding message to Messaging Service. UserId: ${userId}, ChannelId: ${sendMessageRequestDto.channelId}, Message: "${sendMessageRequestDto.content}"`);

        try {
            await axios.post(
                this.sendMessageUrl,
                sendMessageRequestDto,
                { headers: { [AuthHeader.USER_ID]: userId } }
            );
        } catch (error: any) {
            this.logger.error(`[ChatService] Message forwarding failed: ${error.message}`, error.stack);

            socket.emit(ChatEvents.ERROR, {
                event: ChatEvents.SEND_MESSAGE,
                message: 'Failed to send message',
                details: error.response?.data?.message || error.message
            });
        }
    }

    private async ensureSocketSubscribedToChannels(socket: Socket, channelIds: string[]): Promise<void> {
        if (channelIds.length === 0) {
            return;
        }

        socket.join(channelIds);
        const redisChannels = channelIds.map(id => `${this.CHANNEL_PREFIX}${id}`);
        await this.redisClient.subscribe(...redisChannels);
    }

    private resolveSocketUserId(socket: Socket): string | undefined {
        const headerVal = socket.handshake.headers[AuthHeader.USER_ID];
        if (typeof headerVal === 'string' && headerVal.length > 0) {
            return headerVal;
        }

        const cookieHeader = socket.handshake.headers.cookie;
        if (!cookieHeader) {
            return undefined;
        }

        const token = this.parseCookies(cookieHeader)[AuthCookie.ACCESS_TOKEN];
        if (!token) {
            return undefined;
        }

        try {
            const secret = this.chatConfig.jwtSecret;
            const payload = this.jwtService.verify<{ sub?: string }>(token, { secret });

            return payload.sub;
        } catch {
            return undefined;
        }
    }

    private parseCookies(cookieHeader: string): Record<string, string> {
        return cookieHeader.split(';').reduce((acc, part) => {
            const idx = part.trim().indexOf('=');
            if (idx <= 0) {
                return acc;
            }
            const key = part.substring(0, idx).trim();
            const value = part.substring(idx + 1).trim();
            acc[key] = value;
            return acc;
        }, {} as Record<string, string>);
    }

    private async updatePresenceStatus(endpointUrl: string, socket: Socket): Promise<boolean> {
        const userId = socket.data.userId as string;

        try {
            await axios.post(
                endpointUrl,
                { socketId: socket.id },
                { headers: { [AuthHeader.USER_ID]: userId } }
            );

            return true;
        } catch (error: any) {
            const reason = error.response?.data?.message || error.message;
            this.logger.error(`Failed to update presence at ${endpointUrl}: ${reason}`);

            return false;
        }
    }
}