import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class MessagePayloadDto {
    @IsUUID('all')
    messageId: string;

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsUUID('all')
    senderId: string;

    @IsNotEmpty()
    @IsString()
    senderUsername: string;

    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    sentAt: Date;
}