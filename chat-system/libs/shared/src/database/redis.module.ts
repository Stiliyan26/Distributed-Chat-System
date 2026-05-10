import { Inject, Logger, Module, OnModuleDestroy } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

import { REDIS_CLIENT, REDIS_DATABASE_URL, REDIS_PUBSUB_URL } from '../constants/redis.constants';

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: (configService: ConfigService) => {
                const redisUrl = configService.get<string>('redis.url');

                if (!redisUrl) {
                    throw new Error(
                        `Missing redis.url from ConfigModule. Presence: load redis.config (${REDIS_DATABASE_URL}). Chat/delivery: load redis-pubsub.config (${REDIS_PUBSUB_URL} or ${REDIS_DATABASE_URL} fallback).`,
                    );
                }

                try {
                    const u = new URL(redisUrl);
                    const port = u.port || "6379";
                    Logger.log(
                        `Redis client → ${u.protocol}//${u.hostname}:${port} (credentials omitted)`,
                        "RedisModule",
                    );
                } catch {
                    Logger.warn("Redis client: could not parse redis.url for host log", "RedisModule");
                }

                return new Redis(redisUrl);
            },
            inject: [ConfigService]
        }
    ],
    exports: [REDIS_CLIENT]
})
export class RedisModule implements OnModuleDestroy {

    constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) { }

    async onModuleDestroy() {
        if (this.redisClient) {
            await this.redisClient.quit();
        }
    }
}