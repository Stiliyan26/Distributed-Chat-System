import { All, Controller, Next, Req, Res } from "@nestjs/common";
import { NextFunction, Request, RequestHandler, Response } from 'express';

import { AuthRoutes } from "@libs/shared/src/constants/routes.constants";
import { ConfigService } from "@nestjs/config";

import { ResilientProxyFactory } from "../../resilience/resilient-proxy.factory";

@Controller(AuthRoutes.PREFIX)
export class AuthProxyController {

    private readonly authServiceUrl: string;
    private readonly proxyMiddleware: RequestHandler;

    constructor(
        private readonly configService: ConfigService,
        private readonly resilientProxy: ResilientProxyFactory,
    ) {
        this.authServiceUrl = this.configService.get<string>('services.auth.url');
        this.proxyMiddleware = this.resilientProxy.createHttpProxy('auth', this.authServiceUrl);
    }

    @All('*')
    proxyAuth(
        @Req() req: Request,
        @Res() res: Response,
        @Next() next: NextFunction
    ) {
        return this.proxyMiddleware(req, res, next);
    }
}