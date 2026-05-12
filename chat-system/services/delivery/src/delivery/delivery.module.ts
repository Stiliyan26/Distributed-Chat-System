import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import redisPubSubConfig from "@libs/shared/src/database/redis-pubsub.config";
import { RedisModule } from "@libs/shared/src/database/redis.module";
import { HealthController } from "@libs/shared/src/health/health.controller";

import deliveryConfig from "../config/delivery.config";
import { DeliveryController } from "./delivery.controller";
import { DeliveryService } from "./delivery.service";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [deliveryConfig, redisPubSubConfig]
        }),
        RedisModule,
    ],
    controllers: [DeliveryController, HealthController],
    providers: [DeliveryService]
})
export class DeliveryModule { };