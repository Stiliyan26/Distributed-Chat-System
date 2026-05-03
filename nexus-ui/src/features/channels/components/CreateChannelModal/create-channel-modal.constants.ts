/** React Query cache key for the signed-in user's channel list. */
export const userChannelsQueryKey = ["channels"] as const;

/** Delay after the user types before calling the member search API. */
export const memberSearchDebounceMs = 300;

export const createChannelFormElementIds = {
  channelNameInput: "create-channel-name-input",
  memberSearchInput: "create-channel-member-search-input",
} as const;

export const createChannelGenericErrorMessage =
  "Failed to create channel. Try again.";
