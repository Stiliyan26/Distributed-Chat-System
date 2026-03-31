import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { And, FindOptionsWhere, ILike, In, MoreThan, Repository } from "typeorm";

import { GetUserListResponseDto } from "./dto/get-user-list.response.dto";
import { UserEntity } from "./entities/user.entity";

@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>
    ) { }

    async getPaginatedUsersByUsername(
        username: string | null,
        cursor: string | null
    ): Promise<GetUserListResponseDto> {
        const users = await this.userRepo.find({
            where: this.buildUsernameWhere(username, cursor),
            select: ['id', 'username', 'email'],
            order: { username: 'ASC' },
            take: 10
        });

        const nextCursor = users.length === 10
            ? users[users.length - 1].username
            : null;

        return {
            data: users,
            nextCursor
        }
    }

    async getUsersEmails(ids: string[]): Promise<string[]> {
        const users = await this.userRepo.find({
            where: {
                id: In(ids)
            },
            select: ['email']
        });

        return users.map(user => user.email);
    }

    private buildUsernameWhere(
        username: string | null,
        cursor: string | null
    ): FindOptionsWhere<UserEntity> {
        const prefixFilter = username
            ? ILike(`${username}%`)
            : null;

        if (prefixFilter && cursor) {
            return {
                username: And(prefixFilter, MoreThan(cursor))
            };
        }

        else if (prefixFilter) {
            return { username: prefixFilter }
        }

        else if (cursor) {
            return { username: MoreThan(cursor) }
        }

        return {};
    }
}