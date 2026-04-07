import { IsArray, IsUUID } from "class-validator";

export class JoinChannelDto {
    @IsArray()
    @IsUUID('all', { each: true })
    channelIds: string[];
}