import { Body, Controller, Get, Post, Query } from "@nestjs/common";

import { UsersService } from "./users.service";

import { UserRoutes } from '@libs/shared/src/constants/routes.constants';

import { GetUserEmailsRequestDto } from "./dto/get-user-emails.request.dto";
import { GetUserListResponseDto } from "./dto/get-user-list.response.dto";

@Controller(UserRoutes.PREFIX)
export class UsersController {

    constructor(private readonly userService: UsersService) { }

    @Get()
    getUsers(
        @Query('username') username?: string,
        @Query('cursor') cursor?: string
    ): Promise<GetUserListResponseDto> {
        return this.userService.getPaginatedUsersByUsername(username, cursor);
    }

    @Post(UserRoutes.EMAILS)
    getUsersEmails(@Body() getUserEmailsRequestDto: GetUserEmailsRequestDto): Promise<string[]> {
        return this.userService.getUsersEmails(getUserEmailsRequestDto.ids);
    }
}