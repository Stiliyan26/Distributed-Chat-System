import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class DeliveryPayloadDto {
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