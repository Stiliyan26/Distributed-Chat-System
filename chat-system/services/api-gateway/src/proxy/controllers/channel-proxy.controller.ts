import { All, Controller, Next, Req, Res, UseGuards } from "@nestjs/common";
import { NextFunction, Request, Response } from 'express';

import proxy from "express-http-proxy";

import { ChannelRoutes } from '@libs/shared/src';
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "../../common/auth.guard";

@UseGuards(AuthGuard)
@Controller(ChannelRoutes.PREFIX)
export class ChannelProxyController {

    private readonly channelServiceUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.channelServiceUrl = this.configService.get<string>('services.channel.url');
    }

    @All('*')
    proxyChannel(
        @Req() req: Request,
        @Res() res: Response,
        @Next() next: NextFunction
    ) {
        return proxy(this.channelServiceUrl)(req, res, next);
    }
}