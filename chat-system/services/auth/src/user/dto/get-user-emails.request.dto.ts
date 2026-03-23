import { ArrayNotEmpty, IsArray, IsUUID } from "class-validator";

export class GetUserEmailsRequestDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('all', { each: true })
    ids: string[];
}