import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { RedisModule } from "@libs/shared/src/database/redis.module";
import redisConfig from "@libs/shared/src/database/redis.config";
import presenceConfig from "../config/presence.config";

import { PresenceController } from "./presence.controller";
import { PresenceService } from "./presence.service";
import { HealthController } from "@libs/shared/src/health/health.controller";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [presenceConfig, redisConfig]
        }),
        RedisModule
    ],
    controllers: [PresenceController, HealthController],
    providers: [PresenceService]
})
export class PresenceModule { };