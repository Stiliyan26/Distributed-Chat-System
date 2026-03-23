import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsString, ValidateNested } from "class-validator";

import { DeliveryPayloadDto } from "./delivery-payload.dto";

export class DeliverMessageRequestDto {
    @IsNotEmpty()
    @IsString()
    channelId: string;

    @IsArray()
    @IsString({ each: true })
    offlineUsersEmails: string[];

    @ValidateNested()
    @Type(() => DeliveryPayloadDto)
    message: DeliveryPayloadDto;
}