import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import { AuthCookie, AuthHeader } from "@libs/shared/src/constants/auth.constants";

@Injectable()
export class AuthGuard implements CanActivate {

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: Request = context.switchToHttp().getRequest();

        const token = request.cookies[AuthCookie.ACCESS_TOKEN];

        if (!token) {
            throw new UnauthorizedException('Auth token is absent!');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('jwtSecret')
            });

            request.headers[AuthHeader.USER_ID] = payload.sub;

            return true;
        } catch {
            throw new UnauthorizedException('User was not authenticated!');
        }
    }
}