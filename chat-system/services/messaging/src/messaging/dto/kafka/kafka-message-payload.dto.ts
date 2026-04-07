import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class KafkaMessagePayloadDto {
    @IsNotEmpty()
    @IsUUID('all')
    channelId: string;

    @IsNotEmpty()
    @IsUUID('all')
    senderId: string;

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
