import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateChannelRequestDto {
    @IsNotEmpty()
    @IsString()
    channelName: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('all', { each: true })
    memberIds: string[];
}