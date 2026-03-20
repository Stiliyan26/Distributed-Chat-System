import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, IsUUID, ValidateNested } from "class-validator";

import { MessagePayloadDto } from "./message-payload.dto";

export class DeliverMessageRequestDto {
    @IsNotEmpty()
    @IsString()
    channelId: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    offlineUsersEmails: string[];

    @ValidateNested()
    @Type(() => MessagePayloadDto)
    message: MessagePayloadDto;
}