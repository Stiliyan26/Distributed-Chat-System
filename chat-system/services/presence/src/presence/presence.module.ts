import { Module } from "@nestjs/common";
import { RedisModule } from "../redis/redis.module";
import { PresenceController } from "./controller/presence.controller";
import { PresenceService } from "./services/presence.service";

@Module({
    imports: [RedisModule],
    controllers: [PresenceController],
    providers: [PresenceService]
})
export class PresenceModule { };