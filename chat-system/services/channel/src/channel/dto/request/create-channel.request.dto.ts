import { ArrayMinSize, IsArray, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateChannelRequestDto {
    @IsNotEmpty()
    @IsString()
    channelName: string;

    @IsArray()
    @ArrayMinSize(1)
    @IsUUID(4, { each: true })
    memberIds: string[];
}