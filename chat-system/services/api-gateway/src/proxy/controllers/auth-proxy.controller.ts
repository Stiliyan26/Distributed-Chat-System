import { All, Controller, Next, Req, Res } from "@nestjs/common";
import { NextFunction, Request, Response } from 'express';

import proxy from "express-http-proxy";

import { AuthRoutes } from "@libs/shared/src/constants/routes.constants";
import { ConfigService } from "@nestjs/config";

@Controller(AuthRoutes.PREFIX)
export class AuthProxyController {

    private readonly authServiceUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.authServiceUrl = this.configService.get<string>('services.auth.url');
    }

    @All('*')
    proxyAuth(
        @Req() req: Request,
        @Res() res: Response,
        @Next() next: NextFunction
    ) {
        return proxy(this.authServiceUrl)(req, res, next);
    }
}