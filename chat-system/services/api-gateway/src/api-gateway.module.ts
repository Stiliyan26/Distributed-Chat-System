import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import configuration from './config/configuration';
import { GatewayHealthController } from './health/gateway-health.controller';
import { ProxyModule } from "./proxy/proxy.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration]
        }),
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                throttlers: [
                    {
                        // throttleTtlMs = 60_000 → 1 minute (this is the counting window, in milliseconds).
                        ttl: config.get<number>('gateway.throttleTtlMs')!,
                        // throttleLimit = 200 → at most 200 requests in that 1 minute (per tracker, usually IP).
                        limit: config.get<number>('gateway.throttleLimit')!,
                    },
                ],
            }),
        }),
        JwtModule.register({}),
        ProxyModule
    ],
    controllers: [GatewayHealthController],
    providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
    ]
})
export class ApiGatewayModule { };