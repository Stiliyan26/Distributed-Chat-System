import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddChannelMemberRequestDto {
  @IsNotEmpty()
  @IsUUID('all')
  memberId: string;
}
