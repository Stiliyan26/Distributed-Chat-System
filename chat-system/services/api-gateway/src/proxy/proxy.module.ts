import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { AuthGuard } from "../common/auth.guard";
import { AuthProxyController } from "./controllers/auth-proxy.controller";
import { ChannelProxyController } from "./controllers/channel-proxy.controller";
import { MessagingProxyController } from "./controllers/messaging-proxy.controller";
import { UsersProxyController } from "./controllers/users-proxy.controller";
import { ChatProxyMiddleware } from "./middleware/chat-proxy.middleware";

@Module({
    imports: [ConfigModule, JwtModule],
    controllers: [
        AuthProxyController,
        ChannelProxyController,
        MessagingProxyController,
        UsersProxyController
    ],
    providers: [AuthGuard, ChatProxyMiddleware]
})
export class ProxyModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(ChatProxyMiddleware)
            .forRoutes('/socket.io');
    }
}