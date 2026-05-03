import { useId } from "react";

import { CreateChannelErrorBanner } from "./CreateChannelErrorBanner";
import { CreateChannelFormActions } from "./CreateChannelFormActions";
import { CreateChannelMemberSection } from "./CreateChannelMemberSection";
import { CreateChannelModalBackdrop } from "./CreateChannelModalBackdrop";
import { CreateChannelModalHeader } from "./CreateChannelModalHeader";
import { CreateChannelNameField } from "./CreateChannelNameField";
import { useCreateChannelModalState } from "./useCreateChannelModalState";

export interface CreateChannelModalProps {
  onClose: () => void;
}

export function CreateChannelModal({ onClose }: CreateChannelModalProps) {
  const titleId = useId();
  const modal = useCreateChannelModalState({ onRequestClose: onClose });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <CreateChannelModalBackdrop onRequestClose={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="shadow-modal animate-fade-in relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white dark:border-outline-var/20 dark:bg-surface-low"
      >
        <CreateChannelModalHeader titleId={titleId} onRequestClose={onClose} />

        <form onSubmit={modal.handleCreateChannelSubmit} className="space-y-4 px-6 pb-6 pt-4">
          <CreateChannelNameField
            inputId={modal.formElementIds.channelNameInput}
            value={modal.channelName}
            onValueChange={modal.setChannelName}
          />

          <CreateChannelMemberSection
            memberSearchInputId={modal.formElementIds.memberSearchInput}
            searchQuery={modal.memberSearchQuery}
            onSearchQueryChange={modal.setMemberSearchQuery}
            isSearchRequestPending={modal.isMemberSearchPending}
            searchHits={modal.memberSearchHits}
            selectedMembers={modal.selectedMembers}
            onSelectMember={modal.handleSelectMember}
            onRemoveSelectedMember={modal.handleRemoveSelectedMember}
          />

          <CreateChannelErrorBanner message={modal.errorBannerText} />

          <CreateChannelFormActions
            onRequestClose={onClose}
            isSubmitDisabled={modal.isCreateButtonDisabled}
            isSubmitPending={modal.isCreateRequestInFlight}
          />
        </form>
      </div>
    </div>
  );
}
