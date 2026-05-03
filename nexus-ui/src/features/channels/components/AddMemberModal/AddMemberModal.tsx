import { useId } from "react";

import { CreateChannelModalBackdrop } from "../CreateChannelModal/CreateChannelModalBackdrop";
import { MemberSearchTextField } from "../CreateChannelModal/MemberSearchTextField";
import { AddMemberErrorBanner } from "./AddMemberErrorBanner";
import { AddMemberModalHeader } from "./AddMemberModalHeader";
import { AddMemberSearchHitList } from "./AddMemberSearchHitList";
import { useAddMemberModalState } from "./useAddMemberModalState";

export interface AddMemberModalProps {
  channelId: string;
  existingMemberIds: string[];
  onClose: () => void;
}

export function AddMemberModal({
  channelId,
  existingMemberIds,
  onClose,
}: AddMemberModalProps) {
  const titleId = useId();
  const modal = useAddMemberModalState({
    channelId,
    existingMemberIds,
    onRequestClose: onClose,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <CreateChannelModalBackdrop onRequestClose={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="shadow-modal animate-fade-in relative z-10 flex max-h-[min(90vh,560px)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-outline-var/20 dark:bg-surface-low"
      >
        <AddMemberModalHeader titleId={titleId} onRequestClose={onClose} />

        <div className="flex flex-col gap-4 px-6 pb-6 pt-4">
          <div>
            <label htmlFor={modal.formElementIds.memberSearchInput} className="label-sm mb-2 block">
              Search users
            </label>

            <MemberSearchTextField
              inputId={modal.formElementIds.memberSearchInput}
              value={modal.memberSearchQuery}
              onValueChange={modal.setMemberSearchQuery}
              isBusy={modal.isMemberSearchPending}
              autoFocus
              placeholder="Search username…"
              iconClassName="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-outline-var"
            />
          </div>

          <AddMemberSearchHitList
            hits={modal.memberSearchHits}
            onSelectUser={modal.handleSelectUserToAdd}
            isAddRequestPending={modal.isAddMemberPending}
          />

          {modal.isMemberSearchPending && (
            <p className="text-xs text-slate-500 dark:text-outline-var">Searching…</p>
          )}

          <AddMemberErrorBanner message={modal.errorBannerText} />
        </div>
      </div>
    </div>
  );
}
