import { ArrayMinSize, IsArray, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateChannelRequestDto {
    @IsNotEmpty()
    @IsString()
    channelName: string;

    @IsArray()
    @ArrayMinSize(1)
    @IsUUID('all', { each: true })
    memberIds: string[];
}