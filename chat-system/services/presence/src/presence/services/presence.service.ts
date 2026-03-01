import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { join } from "path";

import { readFileSync } from "fs";
import { REDIS_CLIENT } from "../../constants/redis.constants";
import { HeartbeatDto } from "../dto/heartbeat.request.dto";
import { MarkOnlineRequestDto } from "../dto/mark-online.request.dto";
import { OfflineRequestDto } from "../dto/offline.request.dto";

@Injectable()
export class PresenceService implements OnModuleInit {
    private markOfflineScript: string;

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redisService: Redis
    ) { }

    onModuleInit() {
        const isProd = process.env.NODE_ENV === 'production';
        const scriptPath = isProd
            ? join(__dirname, './assets/redis/markOffline.lua')
            : join(__dirname, '../../assets/redis/markOffline.lua');

        this.markOfflineScript = readFileSync(scriptPath, 'utf-8');
    }

    async getUsersStatus(userIds: string[]) {
        if (userIds.length === 0) {
            return { online: [], offline: [] };
        }

        const pipeline = this.redisService.pipeline();

        userIds.forEach((id) => pipeline.exists(this.getUserOnlineKey(id)));

        const results = await pipeline.exec();

        const online = [];
        const offline = [];

        results.forEach(([err, exists], idx) => {
            if (!err && exists === 1) {
                online.push(userIds[idx]);
            } else {
                offline.push(userIds[idx]);
            }
        });

        return { online, offline };
    }

    async markOnline(markOnlineDto: MarkOnlineRequestDto) {
        const { socketId, userId } = markOnlineDto;

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

    async markOffline(offlineDto: OfflineRequestDto) {
        const { socketId, userId } = offlineDto;

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

    async refreshHeartbeat(heartbeatDto: HeartbeatDto) {
        const { socketId, userId } = heartbeatDto;

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