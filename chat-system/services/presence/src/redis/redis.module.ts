import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import Redis from "ioredis";
import { REDIS_CLIENT } from "../constants/redis.constants";

@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: (configService: ConfigService) => {
                return new Redis(configService.get<string>(REDIS_CLIENT))
            },
            inject: [ConfigService]
        }
    ],
    exports: [REDIS_CLIENT]
})
export class RedisModule { }