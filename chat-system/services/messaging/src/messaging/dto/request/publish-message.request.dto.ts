import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class PublishMessageRequestDto {
    @IsNotEmpty()
    @IsUUID('all')
    channelId: string;

    @IsNotEmpty()
    @IsString()
    senderUsername: string;

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    sentAt: Date;
}