export class UserChannelItemDto {
    channelId: string;
    channelName: string;
}

export type GetUserChannelsResponseDto = UserChannelItemDto[];