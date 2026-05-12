import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import redisPubSubConfig from "@libs/shared/src/database/redis-pubsub.config";
import { RedisModule } from "@libs/shared/src/database/redis.module";

import deliveryConfig from "../config/delivery.config";
import { DeliveryController, DeliveryHealthController } from "./delivery.controller";
import { DeliveryService } from "./delivery.service";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [deliveryConfig, redisPubSubConfig]
        }),
        RedisModule,
    ],
    controllers: [DeliveryController, DeliveryHealthController],
    providers: [DeliveryService]
})
export class DeliveryModule { };