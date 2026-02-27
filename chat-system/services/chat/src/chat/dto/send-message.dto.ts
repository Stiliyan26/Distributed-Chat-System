import { IsDate, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class SendMessageDto {
    @IsUUID()
    @IsNotEmpty()
    channelId: string;

    @IsNotEmpty()
    @IsString()
    senderUsername: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsNotEmpty()
    @IsDate()
    sentAt: string;
}