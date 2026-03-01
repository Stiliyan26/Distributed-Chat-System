import { IsNotEmpty, IsString } from "class-validator";

export class MarkOnlineRequestDto {
    @IsNotEmpty()
    @IsString()
    socketId: string;

    @IsNotEmpty()
    @IsString()
    userId: string;
}