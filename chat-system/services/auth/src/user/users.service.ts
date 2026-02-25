import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";

import { UserListResponseDto } from "./dto/user-list.response.dto";
import { UserEntity } from "./entities/user.entity";

@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>
    ) { }

    async getPaginatedUsersByUsername(username: string | null): Promise<UserListResponseDto> {
        const whereCondition = username
            ? { username: ILike(`${username}%`) }
            : {}

        const users = await this.userRepo.find({
            where: whereCondition,
            order: {
                username: 'ASC'
            },
            take: 10
        });

        const nextCursor = users.length === 10
            ? users[users.length - 1].username
            : null;

        const usersWithExcludedFields = this.usersListWithExcludedProps(users);

        return {
            data: usersWithExcludedFields,
            nextCursor
        }
    }

    private usersListWithExcludedProps(users: UserEntity[]) {
        return users.map((user) => ({
            id: user.id,
            username: user.username,
            email: user.email
        }));
    }
}