import type { UserSearchResult } from "@/types";

import { MemberSearchHitList } from "./MemberSearchHitList";
import { MemberSearchTextField } from "./MemberSearchTextField";
import { SelectedMemberChips } from "./SelectedMemberChips";

interface CreateChannelMemberSectionProps {
  memberSearchInputId: string;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  isSearchRequestPending: boolean;
  searchHits: UserSearchResult[];
  selectedMembers: UserSearchResult[];
  onSelectMember: (member: UserSearchResult) => void;
  onRemoveSelectedMember: (memberId: string) => void;
}

export function CreateChannelMemberSection({
  memberSearchInputId,
  searchQuery,
  onSearchQueryChange,
  isSearchRequestPending,
  searchHits,
  selectedMembers,
  onSelectMember,
  onRemoveSelectedMember,
}: CreateChannelMemberSectionProps) {
  return (
    <div>
      <label htmlFor={memberSearchInputId} className="label-sm mb-2 block">
        Add Members
      </label>

      <MemberSearchTextField
        inputId={memberSearchInputId}
        value={searchQuery}
        onValueChange={onSearchQueryChange}
        isBusy={isSearchRequestPending}
      />

      <SelectedMemberChips
        members={selectedMembers}
        onRemoveMember={onRemoveSelectedMember}
      />

      <MemberSearchHitList hits={searchHits} onSelectMember={onSelectMember} />

      {isSearchRequestPending && (
        <p className="mt-2 text-xs text-outline-var">Searching nodes...</p>
      )}
    </div>
  );
}
