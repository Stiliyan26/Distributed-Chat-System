import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

import { REDIS_CLIENT } from "../../constants/redis.constants";
import { HeartbeatDto } from "../dto/heartbeat.request.dto";
import { MarkOnlineRequestDto } from "../dto/mark-online.request.dto";
import { OfflineRequestDto } from "../dto/offline.request.dto";

@Injectable()
export class PresenceService {

    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redisService: Redis
    ) { }

    async getUsersStatus(userIds: string[]) {
    }

    async markOnline(markOnlineDto: MarkOnlineRequestDto) {
        const { socketId, userId } = markOnlineDto;

        const userOnlineKey = this.getUserOnlineKey(userId);
        const userConnectionsKey = this.getUserConnectionsKey(userId);
        const heartbeatKey = this.getHeartbeatKey(socketId);

        await this.redisService.pipeline()
            .set(userOnlineKey, '1', 'EX', 35)
            .sadd(userConnectionsKey, socketId)
            .set(heartbeatKey, '1', 'EX', 35)
            .exec();
    }

    async markOffline(offlineDto: OfflineRequestDto) {
        const { socketId, userId } = offlineDto;

        const pipleine = this.redisService.pipeline();

        const userConnectionsKey = this.getUserConnectionsKey(userId);
        const heartbeatKey = this.getHeartbeatKey(socketId);

        pipleine.srem(userConnectionsKey, socketId);
        pipleine.del(heartbeatKey);

        const socketIds = await this.redisService.smembers(userConnectionsKey);
        const otherSocketIds = socketIds.filter(id => id !== socketId);

        otherSocketIds.forEach((socketId) => pipleine.exists(this.getHeartbeatKey(socketId)));

        const results = await pipleine.exec();
        const existenceResults = results.slice(2);

        let liveCount = 0;
        const staleSocketIds: string[] = [];

        for (let i = 0; i < existenceResults.length; i++) {
            const [err, heartbeat] = existenceResults[i];
            const currSocketId = otherSocketIds[i];

            if (!err && heartbeat === 1) {
                liveCount++;
            } else {
                staleSocketIds.push(currSocketId);
            }
        }

        if (staleSocketIds.length > 0) {
            await this.redisService.srem(this.getUserConnectionsKey(userId), ...staleSocketIds);
        }

        if (liveCount === 0) {
            await this.redisService.del(this.getUserOnlineKey(userId));
        }
    }

    async refreshHeartbeat(heartbeatDto: HeartbeatDto) {

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