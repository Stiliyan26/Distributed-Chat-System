export class UserResponseDto {
    id: string;
    username: string;
    email: string;
}

export class UserListResponseDto {
    data: UserResponseDto[];
    nextCursor: string | null;
}