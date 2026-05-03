export interface ChatPreviewMessage {
  sender: string;
  content: string;
}

export type ChatPreviewMap = Record<string, ChatPreviewMessage>;
