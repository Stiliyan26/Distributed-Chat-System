import { Body, Controller, Get, Post, Query } from "@nestjs/common";

import { UsersService } from "./users.service";

import { UserRoutes } from '@libs/shared/src/constants/routes.constants';

import { UsersEmailsResponse } from "@libs/shared/src/interfaces/users-emails.interface";
import { GetUserListResponseDto } from "./dto/get-user-list.response.dto";
import { GetUserEmailsRequestDto } from "./dto/get-user-emails.request.dto";

@Controller(UserRoutes.PREFIX)
export class UsersController {

    constructor(private readonly userService: UsersService) { }

    @Get()
    getUsers(@Query('username') username?: string): Promise<GetUserListResponseDto> {
        return this.userService.getPaginatedUsersByUsername(username);
    }

    @Post(UserRoutes.EMAILS)
    getUsersEmails(@Body() getUserEmailsRequestDto: GetUserEmailsRequestDto): Promise<UsersEmailsResponse> {
        return this.userService.getUsersEmails(getUserEmailsRequestDto.ids);
    }
}