import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsString, ValidateNested } from "class-validator";

import { MessagePayloadDto } from "./message-payload.dto";

export class DeliverMessageRequestDto {
    @IsNotEmpty()
    @IsString()
    channelId: string;

    @IsArray()
    @IsString({ each: true })
    offlineUsersEmails: string[];

    @ValidateNested()
    @Type(() => MessagePayloadDto)
    message: MessagePayloadDto;
}