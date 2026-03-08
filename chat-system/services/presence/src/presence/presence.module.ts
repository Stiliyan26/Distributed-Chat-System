import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { RedisModule } from "@libs/shared/src/database/redis.module";

import { PresenceController } from "./controller/presence.controller";
import { PresenceService } from "./services/presence.service";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        RedisModule
    ],
    controllers: [PresenceController],
    providers: [PresenceService]
})
export class PresenceModule { };