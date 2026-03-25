import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import deliveryConfig, { DELIVERY_CONFIG_KEY } from "../config/delivery.config";
import redisConfig from "@libs/shared/src/database/redis.config";

import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/adapters/handlebars.adapter";
import { join } from "path";

import { RedisModule } from "@libs/shared/src/database/redis.module";
import { DeliveryController } from "./delivery.controller";
import { DeliveryService } from "./delivery.service";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [deliveryConfig, redisConfig]
        }),
        RedisModule,
        MailerModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                transport: {
                    host: configService.get(`${DELIVERY_CONFIG_KEY}.smtpHost`),
                    port: configService.get(`${DELIVERY_CONFIG_KEY}.smtpPort`),
                    secure: configService.get(`${DELIVERY_CONFIG_KEY}.smtpPort`) === 465,
                    auth: {
                        user: configService.get(`${DELIVERY_CONFIG_KEY}.smtpUser`),
                        pass: configService.get(`${DELIVERY_CONFIG_KEY}.smtpPass`)
                    },
                },
                defaults: {
                    from: '"Chat System" <noreply@chat-system.com>',
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
    controllers: [DeliveryController],
    providers: [DeliveryService]
})
export class DeliveryModule { };