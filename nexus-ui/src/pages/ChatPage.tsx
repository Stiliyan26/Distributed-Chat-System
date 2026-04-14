import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Hash, Info, Star, Pin, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { EmptyChat, NoChannelSelected } from '@/components/chat/EmptyChat';
import { ChannelDetails } from '@/components/channel/ChannelDetails';
import { CreateChannelModal } from '@/components/channel/CreateChannelModal';
import { ConnectionBanner } from '@/components/ui/ConnectionBanner';
import { getMessages } from '@/api/messages';
import { useAuth } from '@/context/useAuth';
import { useSocket } from '@/context/useSocket';
import { formatDate, mergeChatMessages } from '@/lib/utils';
import type { Channel, Message, SocketMessage } from '@/types';

export function ChatPage() {
  const { user } = useAuth();
  const { connectionStatus, sendMessage, onNewMessage } = useSocket();

  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [previewMap, setPreviewMap] = useState<Record<string, { sender: string; content: string }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: fetchedMessages = [], isLoading } = useQuery({
    queryKey: ['messages', activeChannel?.channelId],
    queryFn: () => getMessages(activeChannel!.channelId),
    enabled: !!activeChannel?.channelId,
    staleTime: 30_000,
  });

  // Merge REST + optimistic + socket echoes (same logical message deduped by fingerprint)
  const messages = useMemo(
    () => mergeChatMessages(fetchedMessages, localMessages),
    [fetchedMessages, localMessages],
  );

  const usernameHints = useMemo(() => {
    const m: Record<string, string> = {};
    for (const msg of messages) {
      if (msg.senderId && msg.senderUsername) {
        m[msg.senderId] = msg.senderUsername;
      }
    }
    return m;
  }, [messages]);

  // Subscribe to socket new_message events
  useEffect(() => {
    const unsubscribe = onNewMessage((msg: SocketMessage) => {
      const inActiveChannel = msg.channelId === activeChannel?.channelId;

      if (inActiveChannel) {
        const newMsg: Message = {
          channelId: msg.channelId ?? activeChannel!.channelId,
          senderId: msg.senderId,
          senderUsername: msg.senderUsername,
          content: msg.content,
          sentAt: msg.sentAt,
          _id: `sock-${msg.sentAt}-${msg.senderId}`,
        };
        setLocalMessages((prev) => {
          if (prev.find((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        setTypingUser(null);
      } else if (msg.channelId) {
        setUnreadMap((prev) => ({
          ...prev,
          [msg.channelId!]: (prev[msg.channelId!] ?? 0) + 1,
        }));
        setPreviewMap((prev) => ({
          ...prev,
          [msg.channelId!]: { sender: msg.senderUsername, content: msg.content },
        }));
      }
    });
    return unsubscribe;
  }, [onNewMessage, activeChannel?.channelId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectChannel = (channel: Channel) => {
    setActiveChannel(channel);
    setLocalMessages([]);
    setUnreadMap((prev) => ({ ...prev, [channel.channelId]: 0 }));
    setPreviewMap((prev) => { const next = { ...prev }; delete next[channel.channelId]; return next; });
    setShowDetails(false);
  };

  const handleSend = useCallback(
    (content: string) => {
      if (!activeChannel || !user) return;

      // Optimistic message using exact backend field names
      const optimistic: Message = {
        _id: `opt-${Date.now()}`,
        _optimistic: true,
        channelId: activeChannel.channelId,
        senderId: user.id,
        senderUsername: user.username,
        content,
        sentAt: new Date().toISOString(),
      };
      setLocalMessages((prev) => [...prev, optimistic]);

      // Send via socket with the exact payload the backend expects
      sendMessage(activeChannel.channelId, user.username, content);
    },
    [activeChannel, user, sendMessage],
  );

  // Group messages by date for date separators
  const renderMessages = () => {
    const result: React.ReactNode[] = [];
    let lastDate = '';
    let lastSenderId = '';

    messages.forEach((msg, idx) => {
      const date = formatDate(msg.sentAt);
      if (date !== lastDate) {
        result.push(
          <div key={`sep-${idx}`} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 h-px bg-outline-var/15" />
            <span className="label-sm text-outline-var/60">{date}</span>
            <div className="flex-1 h-px bg-outline-var/15" />
          </div>,
        );
        lastDate = date;
        lastSenderId = '';
      }
      const showHeader = msg.senderId !== lastSenderId;
      result.push(
        <MessageBubble
          key={msg._id ?? `${msg.senderId}-${msg.sentAt}-${idx}`}
          message={msg}
          isOwn={msg.senderId === user?.id}
          showHeader={showHeader}
        />,
      );
      lastSenderId = msg.senderId;
    });
    return result;
  };

  return (
    <div className="flex h-full bg-slate-100 dark:bg-surface overflow-hidden">
      <Sidebar
        activeChannelId={activeChannel?.channelId ?? null}
        onSelectChannel={handleSelectChannel}
        onCreateChannel={() => setShowCreateModal(true)}
        unreadMap={unreadMap}
        previewMap={previewMap}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Connection banners */}
        {(connectionStatus.type === 'connecting' || connectionStatus.type === 'error') && (
          <ConnectionBanner status={connectionStatus} />
        )}
        {connectionStatus.type === 'connected' && (
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
            {/* Chat column */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Channel header */}
              <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-outline-var/10 flex-shrink-0">
                <Hash size={18} className="text-outline-var flex-shrink-0" />
                <h2 className="font-semibold text-slate-900 dark:text-white">{activeChannel.channelName}</h2>
                <div className="flex items-center gap-1 text-xs text-emerald-500 dark:text-emerald-400 ml-1">
                  <Users size={12} />
                  <span>online</span>
                </div>
                <div className="ml-auto flex items-center gap-2 text-outline-var">
                  <button
                    className="rounded p-1.5 transition-colors hover:text-slate-900 dark:hover:text-white"
                    title="Star"
                  >
                    <Star size={16} />
                  </button>
                  <button
                    className="rounded p-1.5 transition-colors hover:text-slate-900 dark:hover:text-white"
                    title="Pinned"
                  >
                    <Pin size={16} />
                  </button>
                  <button
                    className={`rounded p-1.5 transition-colors ${
                      showDetails ? 'text-primary' : 'hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Channel details"
                    onClick={() => setShowDetails((v) => !v)}
                  >
                    <Info size={16} />
                  </button>
                </div>
              </header>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto py-4 space-y-0.5">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <span className="animate-spin border-2 border-indigo-500/30 border-t-indigo-500 rounded-full w-6 h-6" />
                  </div>
                ) : messages.length === 0 ? (
                  <EmptyChat
                    onSendFirst={() =>
                      (document.querySelector('textarea') as HTMLTextAreaElement | null)?.focus()
                    }
                  />
                ) : (
                  <>
                    {renderMessages()}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {typingUser && <TypingIndicator username={typingUser} />}

              <MessageInput
                channelName={activeChannel.channelName}
                onSend={handleSend}
                disabled={
                  connectionStatus.type === 'disconnected' ||
                  connectionStatus.type === 'error'
                }
              />
            </div>

            {/* Channel details panel */}
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

      {showCreateModal && (
        <CreateChannelModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
