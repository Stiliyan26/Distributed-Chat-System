import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { AuthHeader } from '../constants/auth.constants';

export const CurrentUserId = createParamDecorator<unknown, string>(
    (data: unknown, ctx: ExecutionContext): string => {
        const request: Request = ctx.switchToHttp().getRequest();

        return request.headers[AuthHeader.USER_ID] as string;
    }
)