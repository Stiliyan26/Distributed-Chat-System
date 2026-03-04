import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsString, IsUUID, ValidateNested } from "class-validator";

import { MessagePayloadDto } from "./message-payload.dto";

export class DeliverMessageRequestDto {
    @IsNotEmpty()
    @IsString()
    channelId: string;

    @IsArray()
    @IsUUID('all', { each: true })
    offlineUserIds: string[];

    @ValidateNested()
    @Type(() => MessagePayloadDto)
    message: MessagePayloadDto;
}