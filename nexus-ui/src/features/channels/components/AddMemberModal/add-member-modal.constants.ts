export const addMemberGenericErrorMessage = "Could not add member.";

export const addMemberFormElementIds = {
  memberSearchInput: "add-channel-member-search-input",
} as const;

export function channelMembersQueryKey(channelId: string) {
  return ["channel-members", channelId] as const;
}
