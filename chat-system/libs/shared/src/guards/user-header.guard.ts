import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

import { MISSING_USER_IDENDIFIER } from '../constants/error-message.constants';

@Injectable()
export class UserHeaderGuard implements CanActivate {

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp()
            .getRequest<Request>();

        const userId = request.headers['x-user-id'];

        if (!userId) {
            throw new UnauthorizedException(MISSING_USER_IDENDIFIER)
        }

        return true;
    }
}