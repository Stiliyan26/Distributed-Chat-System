import { IsNotEmpty, IsString } from "class-validator";

export class SocketConnectionRequestDto {
    @IsNotEmpty()
    @IsString()
    socketId: string;
}