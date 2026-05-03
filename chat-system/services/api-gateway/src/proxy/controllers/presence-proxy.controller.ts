import { All, Controller, Next, Req, Res, UseGuards } from '@nestjs/common';
import { NextFunction, Request, RequestHandler, Response } from 'express';

import { PresenceRoutes } from '@libs/shared/src/constants/routes.constants';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '../../common/auth.guard';
import { ResilientProxyFactory } from '../../resilience/resilient-proxy.factory';

@UseGuards(AuthGuard)
@Controller(PresenceRoutes.PREFIX)
export class PresenceProxyController {

    private readonly presenceServiceUrl: string;
    private readonly proxyMiddleware: RequestHandler;

    constructor(
        private readonly configService: ConfigService,
        private readonly resilientProxy: ResilientProxyFactory,
    ) {
        this.presenceServiceUrl = this.configService.get<string>('services.presence.url')!;
        this.proxyMiddleware = this.resilientProxy.createHttpProxy('presence', this.presenceServiceUrl);
    }

    @All()
    proxyPresenceBase(
        @Req() req: Request,
        @Res() res: Response,
        @Next() next: NextFunction
    ) {
        return this.proxyMiddleware(req, res, next);
    }

    @All('*path')
    proxyPresence(
        @Req() req: Request,
        @Res() res: Response,
        @Next() next: NextFunction
    ) {
        return this.proxyMiddleware(req, res, next);
    }
}
