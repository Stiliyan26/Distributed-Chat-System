import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/adapters/handlebars.adapter";
import { join } from "path";

import { RedisModule } from "@libs/shared/src/database/redis.module";
import { DeliveryController } from "./delivery.controller";
import { DeliveryService } from "./delivery.service";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        RedisModule,
        MailerModule.forRoot({
            transport: {
                host: process.env.SMTP_HOST || 'smtp.ethereal.email',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
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
        })
    ],
    controllers: [DeliveryController],
    providers: [DeliveryService]
})
export class DeliveryModule { };