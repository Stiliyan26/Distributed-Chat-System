import { useCallback, useEffect, useRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createChannel } from "@/features/channels/api/channels.api";
import { useSocket } from "@/realtime/useSocket";
import { searchUsers } from "@/shared/api/users.api";
import { extractApiErrorMessage } from "@/shared/lib/extractApiErrorMessage";
import type { UserSearchResult } from "@/shared/types";

import {
  createChannelFormElementIds,
  createChannelGenericErrorMessage,
  memberSearchDebounceMs,
  userChannelsQueryKey,
} from "./create-channel-modal.constants";

interface UseCreateChannelModalStateOptions {
  onRequestClose: () => void;
}

export function useCreateChannelModalState({
  onRequestClose,
}: UseCreateChannelModalStateOptions) {
  const queryClient = useQueryClient();
  const { joinAllChannels } = useSocket();

  const [channelName, setChannelName] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberSearchHits, setMemberSearchHits] = useState<UserSearchResult[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<UserSearchResult[]>([]);
  const [isMemberSearchPending, setIsMemberSearchPending] = useState(false);
  const memberSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createChannelMutation = useMutation({
    mutationFn: () =>
      createChannel(
        channelName.trim(),
        selectedMembers.map((member) => member.id),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userChannelsQueryKey });
      await joinAllChannels();
      onRequestClose();
    },
  });

  const runMemberSearch = useCallback(
    async (rawQuery: string) => {
      if (!rawQuery.trim()) {
        setMemberSearchHits([]);
        return;
      }

      setIsMemberSearchPending(true);

      try {
        const users = await searchUsers(rawQuery);

        setMemberSearchHits(
          users.filter(
            (candidate) =>
              !selectedMembers.some((selected) => selected.id === candidate.id),
          ),
        );
      } finally {
        setIsMemberSearchPending(false);
      }
    },
    [selectedMembers],
  );

  useEffect(() => {
    if (memberSearchDebounceRef.current) {
      clearTimeout(memberSearchDebounceRef.current);
    }

    if (!memberSearchQuery.trim()) {
      setMemberSearchHits([]);
      return;
    }

    memberSearchDebounceRef.current = setTimeout(() => {
      void runMemberSearch(memberSearchQuery);
    }, memberSearchDebounceMs);

    return () => {
      if (memberSearchDebounceRef.current) {
        clearTimeout(memberSearchDebounceRef.current);
      }
    };
  }, [memberSearchQuery, runMemberSearch]);

  useEffect(() => {
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onRequestClose();
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => document.removeEventListener("keydown", handleDocumentKeyDown);
  }, [onRequestClose]);

  const handleSelectMember = (member: UserSearchResult) => {
    setSelectedMembers((previous) => [...previous, member]);
    setMemberSearchHits((previous) =>
      previous.filter((hit) => hit.id !== member.id),
    );
    setMemberSearchQuery("");
  };

  const handleRemoveSelectedMember = (memberId: string) => {
    setSelectedMembers((previous) =>
      previous.filter((member) => member.id !== memberId),
    );
  };

  const handleCreateChannelSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!channelName.trim()) return;
    createChannelMutation.mutate();
  };

  const errorBannerText = createChannelMutation.isError
    ? extractApiErrorMessage(
      createChannelMutation.error,
      createChannelGenericErrorMessage,
    )
    : "";

  const trimmedChannelName = channelName.trim();
  const isCreateButtonDisabled =
    !trimmedChannelName || createChannelMutation.isPending;
  const isCreateRequestInFlight = createChannelMutation.isPending;

  return {
    formElementIds: createChannelFormElementIds,
    channelName,
    setChannelName,
    memberSearchQuery,
    setMemberSearchQuery,
    memberSearchHits,
    selectedMembers,
    isMemberSearchPending,
    handleSelectMember,
    handleRemoveSelectedMember,
    handleCreateChannelSubmit,
    errorBannerText,
    isCreateButtonDisabled,
    isCreateRequestInFlight,
  };
}
