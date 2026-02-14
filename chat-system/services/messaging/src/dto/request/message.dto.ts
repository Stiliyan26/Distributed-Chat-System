import { IsDate, IsNotEmpty, IsString } from "class-validator";

export class MessageDto {
  @IsNotEmpty()
  @IsString()
  channelId: string;

  @IsNotEmpty()
  @IsString()
  senderId: string;

  @IsNotEmpty()
  @IsString()
  senderUsername: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsDate()
  sentAt: Date;
}