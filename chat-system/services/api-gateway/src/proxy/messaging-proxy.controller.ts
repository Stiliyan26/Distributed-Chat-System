import { All, Controller, Next, Req, Res, UseGuards } from "@nestjs/common";
import { NextFunction, Request, Response } from 'express';

import proxy from "express-http-proxy";

import { MessageRoutes } from '@libs/shared/src';
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "../common/auth.guard";

@UseGuards(AuthGuard)
@Controller(MessageRoutes.PREFIX)
export class MessagingProxyController {

    private readonly messagingServiceUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.messagingServiceUrl = this.configService.get<string>('services.messaging.url');
    }

    @All('*')
    proxyMessaging(
        @Req() req: Request,
        @Res() res: Response,
        @Next() next: NextFunction
    ) {
        return proxy(this.messagingServiceUrl)(req, res, next);
    }
}