import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { RedisModule } from "@libs/shared/src/database/redis.module";
import redisConfig from "@libs/shared/src/database/redis.config";
import chatConfig from "../config/chat.config";
import { ChatGateway } from "./chat.gateway";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [chatConfig, redisConfig]
        }),
        RedisModule
    ],
    providers: [ChatGateway]
})
export class ChatModule { }