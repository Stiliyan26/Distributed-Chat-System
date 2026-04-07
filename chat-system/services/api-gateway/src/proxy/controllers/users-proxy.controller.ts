import { All, Controller, Next, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NextFunction, Request, RequestHandler, Response } from 'express';

import proxy from "express-http-proxy";

import { UserRoutes } from "@libs/shared/src/constants/routes.constants";
import { AuthGuard } from "../../common/auth.guard";

@UseGuards(AuthGuard)
@Controller(UserRoutes.PREFIX)
export class UsersProxyController {

    private readonly authServiceUrl: string;
    private readonly proxyMiddleware: RequestHandler;

    constructor(private readonly configService: ConfigService) {
        this.authServiceUrl = this.configService.get<string>('services.auth.url');
        this.proxyMiddleware = proxy(this.authServiceUrl);
    }

    @All('*')
    proxyUsersRoot(
        @Req() req: Request,
        @Res() res: Response,
        @Next() next: NextFunction
    ) {
        return this.proxyMiddleware(req, res, next);
    }
}
