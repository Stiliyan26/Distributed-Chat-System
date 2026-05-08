import { All, Controller, Next, Req, Res, UseGuards } from "@nestjs/common";
import { NextFunction, Request, RequestHandler, Response } from 'express';

import { MessageRoutes } from "@libs/shared/src/constants/routes.constants";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "../../common/auth.guard";
import { ResilientProxyFactory } from "../../resilience/resilient-proxy.factory";

@UseGuards(AuthGuard)
@Controller(MessageRoutes.PREFIX)
export class MessagingProxyController {

    private readonly messagingServiceUrl: string;
    private readonly proxyMiddleware: RequestHandler;

    constructor(
        private readonly configService: ConfigService,
        private readonly resilientProxy: ResilientProxyFactory,
    ) {
        this.messagingServiceUrl = this.configService.get<string>('services.messaging.url');
        this.proxyMiddleware = this.resilientProxy.createHttpProxy('messaging', this.messagingServiceUrl);
    }

    @All()
    proxyMessagingBase(
        @Req() req: Request,
        @Res() res: Response,
        @Next() next: NextFunction
    ) {
        return this.proxyMiddleware(req, res, next);
    }

    @All('*path')
    proxyMessagingRoot(
        @Req() req: Request,
        @Res() res: Response,
        @Next() next: NextFunction
    ) {
        return this.proxyMiddleware(req, res, next);
    }
}