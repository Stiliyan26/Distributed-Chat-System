import { Body, Controller, Get, Post, Query } from "@nestjs/common";

import { UsersService } from "./users.service";

import { UserRoutes } from '@libs/shared/src/constants/routes.constants';

import { UsersEmailsResponse } from "@libs/shared/src/interfaces/users-emails.interface";
import { UserListResponseDto } from "./dto/user-list.response.dto";
import { UserIdsRequestDto } from "./dto/users-emails.request.dto";

@Controller(UserRoutes.PREFIX)
export class UsersController {

    constructor(private readonly userService: UsersService) { }

    @Get()
    getUsers(@Query('username') username?: string): Promise<UserListResponseDto> {
        return this.userService.getPaginatedUsersByUsername(username);
    }

    @Post(UserRoutes.EMAILS)
    getUsersEmails(@Body() userIdsDto: UserIdsRequestDto): Promise<UsersEmailsResponse> {
        return this.userService.getUsersEmails(userIdsDto.ids);
    }
}