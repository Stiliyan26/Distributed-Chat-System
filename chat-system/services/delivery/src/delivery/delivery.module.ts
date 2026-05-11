import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/adapters/handlebars.adapter";
import { join } from "path";

import redisPubSubConfig from "@libs/shared/src/database/redis-pubsub.config";
import { RedisModule } from "@libs/shared/src/database/redis.module";

import deliveryConfig, { DELIVERY_CONFIG_KEY } from "../config/delivery.config";
import { DeliveryController } from "./delivery.controller";
import { DeliveryService } from "./delivery.service";
import { DeliveryHealthController } from "./delivery.health.controller";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [deliveryConfig, redisPubSubConfig]
        }),
        RedisModule,
        MailerModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                transport: {
                    host: configService.get(`${DELIVERY_CONFIG_KEY}.smtpHost`),
                    port: configService.get(`${DELIVERY_CONFIG_KEY}.smtpPort`),
                    secure: configService.get(`${DELIVERY_CONFIG_KEY}.smtpPort`) === 465,
                    requireTLS: configService.get(`${DELIVERY_CONFIG_KEY}.smtpPort`) === 587,
                    connectionTimeout: 10000,
                    greetingTimeout: 10000,
                    socketTimeout: 15000,
                    auth: {
                        user: configService.get(`${DELIVERY_CONFIG_KEY}.smtpUser`),
                        pass: configService.get(`${DELIVERY_CONFIG_KEY}.smtpPass`)
                    },
                },
                defaults: {
                    from: `"Chat System" <${configService.get(`${DELIVERY_CONFIG_KEY}.smtpFrom`)}>`,
                },
                template: {
                    dir: join(__dirname, 'assets/templates'),
                    adapter: new HandlebarsAdapter(),
                    options: {
                        strict: true,
                    },
                },
            }),
            inject: [ConfigService]
        })
    ],
    controllers: [DeliveryController, DeliveryHealthController],
    providers: [DeliveryService]
})
export class DeliveryModule { };