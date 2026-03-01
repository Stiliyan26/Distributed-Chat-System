import { IsNotEmpty, IsString } from "class-validator";

export class OfflineRequestDto {
    @IsNotEmpty()
    @IsString()
    socketId: string;

    @IsNotEmpty()
    @IsString()
    userId: string;
}