import { ArrayNotEmpty, IsArray, IsUUID } from "class-validator";

export class UserIdsRequestDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('all', { each: true })
    ids: string[];
}