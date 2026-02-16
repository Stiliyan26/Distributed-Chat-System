import { ArrayMinSize, IsArray, IsNotEmpty, IsString, IsUUID, isUUID } from "class-validator";

export class CreateChannelDto {
    @IsNotEmpty()
    @IsString()
    channelName: string;

    @IsArray()
    @ArrayMinSize(1)
    @IsUUID(4, { each: true })
    members: string[];

    @IsNotEmpty()
    @IsString()
    creatorName: string;
}