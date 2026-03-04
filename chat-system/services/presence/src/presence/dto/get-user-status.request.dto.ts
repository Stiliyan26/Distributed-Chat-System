import { ArrayMinSize, IsArray, IsUUID } from "class-validator";

export class GetUserStatusRequestDto {
    @IsArray()
    @ArrayMinSize(1)
    @IsUUID('all', { each: true })
    userIds: string[];
}