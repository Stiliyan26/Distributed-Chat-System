import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

import { AuthHeader } from "../constants/auth.constants";
import { MISSING_USER_IDENTIFIER } from '../constants/error.constants';

@Injectable()
export class UserHeaderGuard implements CanActivate {

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp()
            .getRequest<Request>();

        const userId = request.headers[AuthHeader.USER_ID];

        if (!userId) {
            throw new UnauthorizedException(MISSING_USER_IDENTIFIER)
        }

        return true;
    }
}