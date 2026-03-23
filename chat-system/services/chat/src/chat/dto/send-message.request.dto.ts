import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class SendMessageRequestDto {
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
    @Type(() => Date)
    sentAt: Date;
}