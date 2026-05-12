import { useAuth } from "@/features/auth/hooks/useAuth";
import { ChannelDetails } from "@/features/channels/components/ChannelDetails/ChannelDetails";
import { CreateChannelModal } from "@/features/channels/components/CreateChannelModal";
import { ChatHeader } from "@/features/chat/components/ChatHeader";
import { ChatMessagesPanel } from "@/features/chat/components/ChatMessagesPanel";
import { NoChannelSelected } from "@/features/chat/components/EmptyChat";
import { MessageInput } from "@/features/chat/components/MessageInput";
import { TypingIndicator } from "@/features/chat/components/TypingIndicator";
import { useChatPageState } from "@/features/chat/hooks/useChatPageState";
import { Sidebar } from "@/shared/layout/sidebar";
import { ConnectionBanner } from "@/shared/ui/ConnectionBanner";

export function ChatPage() {
  const { user } = useAuth();

  const {
    activeChannel,
    closeCreateModal,
    connectionStatus,
    isLoading,
    messages,
    messagesEndRef,
    openCreateModal,
    previewMap,
    selectChannel,
    sendChatMessage,
    setShowDetails,
    showCreateModal,
    showDetails,
    typingUser,
    unreadMap,
    usernameHints,
  } = useChatPageState();

  return (
    <div className="flex h-full bg-slate-100 dark:bg-surface overflow-hidden">
      <Sidebar
        activeChannelId={activeChannel?.channelId ?? null}
        onSelectChannel={selectChannel}
        onCreateChannel={openCreateModal}
        unreadMap={unreadMap}
        previewMap={previewMap}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {(connectionStatus.type === "connecting" ||
          connectionStatus.type === "error") && (
          <ConnectionBanner status={connectionStatus} />
        )}

        {connectionStatus.type === "connected" && (
          <div className="animate-slide-down">
            <ConnectionBanner status={connectionStatus} />
          </div>
        )}

        {!activeChannel ? (
          <div className="flex-1 flex">
            <NoChannelSelected />
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 flex flex-col min-w-0">
              <ChatHeader
                channel={activeChannel}
                showDetails={showDetails}
                onToggleDetails={() => setShowDetails((value) => !value)}
              />

              <ChatMessagesPanel
                isLoading={isLoading}
                messages={messages}
                ownUserId={user?.id}
                messagesEndRef={messagesEndRef}
              />

              {typingUser && <TypingIndicator username={typingUser} />}

              <MessageInput
                channelName={activeChannel.channelName}
                onSend={sendChatMessage}
                sendDisabled={
                  connectionStatus.type === "disconnected" ||
                  connectionStatus.type === "error"
                }
              />
            </div>

            {showDetails && (
              <ChannelDetails
                channel={activeChannel}
                onClose={() => setShowDetails(false)}
                usernameHints={usernameHints}
              />
            )}
          </div>
        )}
      </div>

      {showCreateModal && <CreateChannelModal onClose={closeCreateModal} />}
    </div>
  );
}
