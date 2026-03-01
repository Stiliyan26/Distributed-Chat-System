import { IsNotEmpty, IsString } from "class-validator";

export class HeartbeatDto {
    @IsNotEmpty()
    @IsString()
    socketId: string;

    @IsNotEmpty()
    @IsString()
    userId: string;
}