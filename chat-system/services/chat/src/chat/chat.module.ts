import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { RedisModule } from "@libs/shared/src/database/redis.module";
import redisPubSubConfig from "@libs/shared/src/database/redis-pubsub.config";

import chatConfig, { CHAT_CONFIG_KEY, ChatConfig } from "../config/chat.config";
import { ChatGateway } from "./chat.gateway";
import { HealthController } from "../health.controller";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [chatConfig, redisPubSubConfig]
        }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService<{ [CHAT_CONFIG_KEY]: ChatConfig }>) => {
                const chat = config.get(CHAT_CONFIG_KEY, { infer: true })!;
                return { secret: chat.jwtSecret };
            },
            inject: [ConfigService],
        }),
        RedisModule
    ],
    controllers: [HealthController],
    providers: [ChatGateway]
})
export class ChatModule { }