import { IsDate, IsNotEmpty, IsString } from "class-validator";

export class MessageRequestDto {
    @IsNotEmpty()
    @IsString()
    channelId: string;

    @IsNotEmpty()
    @IsString()
    senderUsername: string;

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsNotEmpty()
    @IsDate()
    sentAt: Date;
}