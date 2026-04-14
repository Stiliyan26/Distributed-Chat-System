import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ResolveUsersRequestDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids: string[];
}
