import { All, Controller, Next, Req, Res, UseGuards } from "@nestjs/common";
import { NextFunction, Request, RequestHandler, Response } from 'express';

import proxy from "express-http-proxy";

import { ChannelRoutes } from "@libs/shared/src/constants/routes.constants";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "../../common/auth.guard";

@UseGuards(AuthGuard)
@Controller(ChannelRoutes.PREFIX)
export class ChannelProxyController {

    private readonly channelServiceUrl: string;
    private readonly proxyMiddleware: RequestHandler;

    constructor(private readonly configService: ConfigService) {
        this.channelServiceUrl = this.configService.get<string>('services.channel.url');
        this.proxyMiddleware = proxy(this.channelServiceUrl);
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