import { useCallback, useEffect, useRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { addChannelMember } from "@/features/channels/api/channels.api";
import { useSocket } from "@/realtime/useSocket";
import { searchUsers } from "@/shared/api/users.api";
import { extractApiErrorMessage } from "@/shared/lib/extractApiErrorMessage";
import type { UserSearchResult } from "@/shared/types";

import {
  memberSearchDebounceMs,
  userChannelsQueryKey,
} from "../CreateChannelModal/create-channel-modal.constants";
import {
  addMemberFormElementIds,
  addMemberGenericErrorMessage,
  channelMembersQueryKey,
} from "./add-member-modal.constants";

interface UseAddMemberModalStateOptions {
  channelId: string;
  existingMemberIds: string[];
  onRequestClose: () => void;
}

export function useAddMemberModalState({
  channelId,
  existingMemberIds,
  onRequestClose,
}: UseAddMemberModalStateOptions) {
  const queryClient = useQueryClient();
  const { joinChannels } = useSocket();

  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberSearchHits, setMemberSearchHits] = useState<UserSearchResult[]>([]);
  const [isMemberSearchPending, setIsMemberSearchPending] = useState(false);
  const memberSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addMemberMutation = useMutation({
    mutationFn: (memberId: string) => addChannelMember(channelId, memberId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: channelMembersQueryKey(channelId),
      });
      await queryClient.invalidateQueries({ queryKey: userChannelsQueryKey });
      joinChannels([channelId]);
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
          users.filter((user) => !existingMemberIds.includes(user.id)),
        );
      } finally {
        setIsMemberSearchPending(false);
      }
    },
    [existingMemberIds],
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

  const handleSelectUserToAdd = (user: UserSearchResult) => {
    addMemberMutation.mutate(user.id);
  };

  const errorBannerText = addMemberMutation.isError
    ? extractApiErrorMessage(addMemberMutation.error, addMemberGenericErrorMessage)
    : "";

  return {
    formElementIds: addMemberFormElementIds,
    memberSearchQuery,
    setMemberSearchQuery,
    memberSearchHits,
    isMemberSearchPending,
    handleSelectUserToAdd,
    errorBannerText,
    isAddMemberPending: addMemberMutation.isPending,
  };
}
