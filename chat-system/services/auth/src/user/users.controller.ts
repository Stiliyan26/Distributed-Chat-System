import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";

import { UsersService } from "./users.service";

import { UserRoutes } from '@libs/shared/src/constants/routes.constants';

import { GetUserEmailsRequestDto } from "./dto/get-user-emails.request.dto";
import { GetUserListResponseDto } from "./dto/get-user-list.response.dto";
import { ResolveUsersRequestDto } from "./dto/resolve-users.request.dto";
import { ResolvedUserDto } from "./dto/resolve-users.response.dto";

@Controller(UserRoutes.PREFIX)
export class UsersController {

    constructor(private readonly userService: UsersService) { }

    @Post(UserRoutes.RESOLVE)
    @HttpCode(HttpStatus.OK)
    resolveUsers(@Body() dto: ResolveUsersRequestDto): Promise<ResolvedUserDto[]> {
        return this.userService.resolveUsersByIds(dto.ids);
    }

    @Get('by-id/:id')
    @HttpCode(HttpStatus.OK)
    async getUserById(@Param('id', ParseUUIDPipe) id: string): Promise<ResolvedUserDto> {
        const user = await this.userService.findById(id);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

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