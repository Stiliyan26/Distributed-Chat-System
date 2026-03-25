import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { join } from "path";

import { REDIS_CLIENT } from "@libs/shared/src/constants/redis.constants";
import { PRESENCE_CONFIG_KEY, PresenceConfig } from "../config/presence.config";
import { readFileSync } from "fs";
import { GetUserStatusResponseDto } from "./dto/get-user-status.response.dto";

@Injectable()
export class PresenceService implements OnModuleInit {

    private readonly logger = new Logger(PresenceService.name);
    private markOfflineScript: string;

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redisService: Redis,
        private readonly configService: ConfigService<{ [PRESENCE_CONFIG_KEY]: PresenceConfig }>
    ) { }

    private get presenceConfig() {
        return this.configService.get(PRESENCE_CONFIG_KEY, { infer: true })!;
    }

    onModuleInit() {
        const isProd = this.presenceConfig.nodeEnv === 'production';
        const scriptPath = isProd
            ? join(__dirname, './assets/redis/markOffline.lua')
            : join(__dirname, '../../assets/redis/markOffline.lua');

        this.markOfflineScript = readFileSync(scriptPath, 'utf-8');
    }

    async getUsersStatus(userIds: string[]): Promise<GetUserStatusResponseDto> {
        const onlineUserIds = [];
        const offlineUserIds = [];

        if (userIds.length === 0) {
            return { onlineUserIds, offlineUserIds };
        }

        const pipeline = this.redisService.pipeline();

        userIds.forEach((id) => pipeline.exists(this.getUserOnlineKey(id)));

        const results = await pipeline.exec();

        results.forEach(([err, exists], idx) => {
            if (!err && exists === 1) {
                onlineUserIds.push(userIds[idx]);
            } else {
                offlineUserIds.push(userIds[idx]);
            }
        });

        this.logger.log(`[PresenceService] Looked up ${userIds.length} members. Result -> Online: ${onlineUserIds.length}, Offline: ${offlineUserIds.length}`);

        return { onlineUserIds, offlineUserIds };
    }

    async markOnline(socketId: string, userId: string) {
        const userOnlineKey = this.getUserOnlineKey(userId);
        const userConnectionsKey = this.getUserConnectionsKey(userId);
        const heartbeatKey = this.getHeartbeatKey(socketId);

        await this.redisService.pipeline()
            .set(userOnlineKey, '1', 'EX', 35)
            .sadd(userConnectionsKey, socketId)
            .expire(userConnectionsKey, 35)
            .set(heartbeatKey, '1', 'EX', 35)
            .exec();
    }

    async markOffline(socketId: string, userId: string) {
        return this.redisService.eval(
            this.markOfflineScript, // The script string
            2, // Number of keys
            this.getUserConnectionsKey(userId), // KEYS[1]
            this.getUserOnlineKey(userId), // KEYS[2]
            socketId, // ARGS[1]
            this.getHeartbeatKey(socketId), // ARGS[2]
            'heartbeat:' // ARGS[3]
        );
    }

    async refreshHeartbeat(socketId: string, userId: string) {
        await this.redisService.pipeline()
            .set(this.getUserOnlineKey(userId), '1', 'EX', 35)
            .set(this.getHeartbeatKey(socketId), '1', 'EX', 35)
            .expire(this.getUserConnectionsKey(userId), 35)
            .exec();
    }

    private getUserOnlineKey(userId: string) {
        return `user:${userId}:online`;
    }

    private getUserConnectionsKey(userId: string) {
        return `user:${userId}:connections`;
    }

    private getHeartbeatKey(socketId: string) {
        return `heartbeat:${socketId}`;
    }
}
