import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { JwtModule } from "@nestjs/jwt";

import configuration from './config/configuration';
import { ProxyModule } from "./proxy/proxy.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration]
        }),
        JwtModule.register({}),
        ProxyModule
    ],
    controllers: [],
    providers: []
})
export class ApiGatewayModule { };