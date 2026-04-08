import { All, Controller, Next, Req, Res, UseGuards } from "@nestjs/common";
import { NextFunction, Request, RequestHandler, Response } from 'express';

import proxy from "express-http-proxy";

import { MessageRoutes } from "@libs/shared/src/constants/routes.constants";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "../../common/auth.guard";

@UseGuards(AuthGuard)
@Controller(MessageRoutes.PREFIX)
export class MessagingProxyController {

    private readonly messagingServiceUrl: string;
    private readonly proxyMiddleware: RequestHandler;

    constructor(private readonly configService: ConfigService) {
        this.messagingServiceUrl = this.configService.get<string>('services.messaging.url');
        this.proxyMiddleware = proxy(this.messagingServiceUrl);
    }

    @All('*')
    proxyMessagingRoot(
        @Req() req: Request,
        @Res() res: Response,
        @Next() next: NextFunction
    ) {
        return this.proxyMiddleware(req, res, next);
    }
}