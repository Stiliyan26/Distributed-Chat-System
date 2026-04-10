import { All, Controller, Next, Req, Res, UseGuards } from "@nestjs/common";
import { NextFunction, Request, RequestHandler, Response } from 'express';

import { ChannelRoutes } from "@libs/shared/src/constants/routes.constants";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "../../common/auth.guard";
import { ResilientProxyFactory } from "../../resilience/resilient-proxy.factory";

@UseGuards(AuthGuard)
@Controller(ChannelRoutes.PREFIX)
export class ChannelProxyController {

    private readonly channelServiceUrl: string;
    private readonly proxyMiddleware: RequestHandler;

    constructor(
        private readonly configService: ConfigService,
        private readonly resilientProxy: ResilientProxyFactory,
    ) {
        this.channelServiceUrl = this.configService.get<string>('services.channel.url');
        this.proxyMiddleware = this.resilientProxy.createHttpProxy('channel', this.channelServiceUrl);
    }

    @All('*')
    proxyChannel(
        @Req() req: Request,
        @Res() res: Response,
        @Next() next: NextFunction
    ) {
        return this.proxyMiddleware(req, res, next);
    }
}