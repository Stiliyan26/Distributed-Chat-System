import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { REDIS_CLIENT, REDIS_DATABASE_URL } from '../constants/redis.constants';

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: (configService: ConfigService) => {
                const redisUrl = configService.get<string>(REDIS_DATABASE_URL);

                if (!redisUrl) {
                    throw new Error(`Configuration error: ${REDIS_DATABASE_URL} is missing`);
                }

                return new Redis(redisUrl);
            },
            inject: [ConfigService]
        }
    ],
    exports: [REDIS_CLIENT]
})
export class RedisModule { }