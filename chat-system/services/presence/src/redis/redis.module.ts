import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { REDIS_CLIENT, REDIS_PRESENCE_URL } from '@libs/shared/src/constants/redis.constants';

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: (configService: ConfigService) => {
                return new Redis(configService.get<string>(REDIS_PRESENCE_URL))
            },
            inject: [ConfigService]
        }
    ],
    exports: [REDIS_CLIENT]
})
export class RedisModule { }