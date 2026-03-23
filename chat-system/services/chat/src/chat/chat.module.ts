import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { RedisModule } from "@libs/shared/src/database/redis.module";
import { ChatGateway } from "./chat.gateway";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        RedisModule
    ],
    providers: [ChatGateway]
})
export class ChatModule { }