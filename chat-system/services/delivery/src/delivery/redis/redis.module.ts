import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import Redis from "ioredis";

import { REDIS_CLIENT, REDIS_PUBSUB_URL } from '@libs/shared/src';

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: (configService: ConfigService) => {
                return new Redis(configService.get<string>(REDIS_PUBSUB_URL))
            },
            inject: [ConfigService]
        }
    ],
    exports: [REDIS_CLIENT]
})
export class RedisModule { }