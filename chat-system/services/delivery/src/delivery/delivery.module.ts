import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { DeliveryController } from "./delivery.controller";
import { DeliveryService } from "./delivery.service";
import { RedisModule } from "./redis/redis.module";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        RedisModule
    ],
    controllers: [DeliveryController],
    providers: [DeliveryService]
})
export class DeliveryModule { };