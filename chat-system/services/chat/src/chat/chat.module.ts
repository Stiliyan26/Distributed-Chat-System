import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { RedisModule } from "@libs/shared/src/database/redis.module";
import redisPubSubConfig from "@libs/shared/src/database/redis-pubsub.config";

import chatConfig from "../config/chat.config";
import { ChatGateway } from "./chat.gateway";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [chatConfig, redisPubSubConfig]
        }),
        RedisModule
    ],
    providers: [ChatGateway]
})
export class ChatModule { }