import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";

import { AuthHeader } from "../constants/auth.constants";
import { MISSING_USER_IDENTIFIER } from '../constants/error.constants';
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class UserHeaderGuard implements CanActivate {

    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp()
            .getRequest<Request>();

        const userId = request.headers[AuthHeader.USER_ID];

        if (!userId) {
            throw new UnauthorizedException(MISSING_USER_IDENTIFIER)
        }

        return true;
    }
}