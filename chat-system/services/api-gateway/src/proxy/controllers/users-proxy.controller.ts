import { All, Controller, Next, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NextFunction, Request, RequestHandler, Response } from 'express';

import { UserRoutes } from "@libs/shared/src/constants/routes.constants";
import { AuthGuard } from "../../common/auth.guard";
import { ResilientProxyFactory } from "../../resilience/resilient-proxy.factory";

@UseGuards(AuthGuard)
@Controller(UserRoutes.PREFIX)
export class UsersProxyController {

    private readonly authServiceUrl: string;
    private readonly proxyMiddleware: RequestHandler;

    constructor(
        private readonly configService: ConfigService,
        private readonly resilientProxy: ResilientProxyFactory,
    ) {
        this.authServiceUrl = this.configService.get<string>('services.auth.url');
        this.proxyMiddleware = this.resilientProxy.createHttpProxy('auth', this.authServiceUrl);
    }

    @All()
    proxyUsersBase(
        @Req() req: Request,
        @Res() res: Response,
        @Next() next: NextFunction
    ) {
        return this.proxyMiddleware(req, res, next);
    }

    @All('*path')
    proxyUsersRoot(
        @Req() req: Request,
        @Res() res: Response,
        @Next() next: NextFunction
    ) {
        return this.proxyMiddleware(req, res, next);
    }
}
