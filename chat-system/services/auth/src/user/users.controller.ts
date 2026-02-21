import { Controller, Get, Query } from "@nestjs/common";
import { UserListResponseDto } from "./dto/user-list.response.dto";
import { UsersService } from "./users.service";

import { UserRoutes } from '@libs/shared/src';

@Controller(UserRoutes.PREFIX)
export class UsersController {

    constructor(private readonly userService: UsersService) { }

    @Get()
    getUsers(@Query('username') username?: string): Promise<UserListResponseDto> {
        return this.userService.getPaginatedUsersByUsername(username);
    }
}