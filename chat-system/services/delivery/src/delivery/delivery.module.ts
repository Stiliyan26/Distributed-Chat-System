import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { RedisModule } from "@libs/shared/src/database/redis.module";
import { DeliveryController } from "./delivery.controller";
import { DeliveryService } from "./delivery.service";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        RedisModule
    ],
    controllers: [DeliveryController],
    providers: [DeliveryService]
})
export class DeliveryModule { };