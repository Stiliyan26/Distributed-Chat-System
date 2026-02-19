import { Controller, Get, Query } from "@nestjs/common";
import { UserListResponseDto } from "./dto/user-list.response.dto";
import { UsersService } from "./users.service";

@Controller('users')
export class UsersController {

    constructor(private readonly userService: UsersService) { }

    @Get()
    getUsers(@Query('username') username?: string): Promise<UserListResponseDto> {
        return this.userService.getPaginatedUsersByUsername(username);
    }
}