import { IsArray, IsString } from "class-validator";

export class GetUserStatusRequestDto {
    @IsArray()
    @IsString({ each: true })
    userIds: string[];
}