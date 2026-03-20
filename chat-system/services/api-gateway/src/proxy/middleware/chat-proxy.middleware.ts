import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { IncomingMessage } from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Socket } from 'net';

import { AuthCookie, AuthHeader } from "@libs/shared/src/constants/auth.constants";

interface ProxyRequest {
    setHeader(name: string, value: string | number): void;
    destroy(): void;
}

@Injectable()
export class ChatProxyMiddleware implements NestMiddleware {
    private _proxy: ReturnType<typeof createProxyMiddleware>;

    get proxy() { return this._proxy; }

    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService
    ) {
        const chatServiceUrl = this.configService.get<string>('services.chat.url');
        const jwtSecret = this.configService.get<string>('jwtSecret');

        this._proxy = createProxyMiddleware({
            target: chatServiceUrl,
            changeOrigin: true,
            ws: true,
            on: {
                proxyReqWs: (proxyReq, req, socket) => {
                    let token: string | undefined;

                    if (req.headers && req.headers.cookie) {
                        token = this.extractTokenFromCookie(req);
                    }

                    if (!token) {
                        console.error('[SocketIoProxy] Missing token on WS upgrade — rejecting socket connection');
                        socket.destroy();
                        return;
                    }

                    if (!this.attachUserHeaders(proxyReq as any, token, jwtSecret)) {
                        socket.destroy();
                    }
                },
                error: (err: Error, req: IncomingMessage, res: Socket) => {
                    console.error('[SocketIoProxy] Upstream error:', err.message);
                    res.destroy();
                }
            }
        });
    }

    use(req: Request, res: Response, next: NextFunction) {
        this._proxy(req, res, next);
    }

    private attachUserHeaders(
        proxyReq: ProxyRequest,
        token: string,
        jwtSecret: string
    ): boolean {
        try {
            const payload = this.jwtService.verify(token, { secret: jwtSecret });

            if (!payload.sub) {
                throw new Error('JWT payload is missing "sub" (user ID)');
            }

            proxyReq.setHeader(AuthHeader.USER_ID, payload.sub);
            console.log('User id attached to request headers.');

            return true;
        } catch (error: any) {
            console.error(`[SocketIoProxy] Invalid JWT token — connection rejected: ${error.message}`);

            proxyReq.destroy();

            return false;
        }
    }

    private extractTokenFromCookie(req: IncomingMessage) {
        const parsedCookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
            const [name, value] = cookie.split('=').map(c => c.trim());

            acc[name] = value;

            return acc;
        }, {} as Record<string, string>);

        return parsedCookies[AuthCookie.ACCESS_TOKEN];
    }
}
