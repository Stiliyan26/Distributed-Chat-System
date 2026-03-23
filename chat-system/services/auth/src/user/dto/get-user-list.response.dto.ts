export class GetUserResponseDto {
    id: string;
    username: string;
    email: string;
}

export class GetUserListResponseDto {
    data: GetUserResponseDto[];
    nextCursor: string | null;
}