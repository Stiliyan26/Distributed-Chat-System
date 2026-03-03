import { IsNotEmpty, IsString } from "class-validator";

export class SocketDto {
    @IsNotEmpty()
    @IsString()
    socketId: string;
}