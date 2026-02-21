import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AuthProxyController } from "./auth-proxy.controller";
import { ChannelProxyController } from "./channel-proxy.controller";
import { MessagingProxyController } from "./messaging-proxy.controller";

@Module({
    imports: [ConfigModule],
    controllers: [
        AuthProxyController,
        ChannelProxyController,
        MessagingProxyController
    ]
})
export class ProxyModule { }