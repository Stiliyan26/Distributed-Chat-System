import type { Message } from "../models/http-types";

import api from "../client/axios";

export const getMessages = (channelId: string) =>
  api.get<Message[]>("/messages", { params: { channelId } }).then((r) => r.data);

export const sendMessageRest = (channelId: string, senderUsername: string, content: string) =>
  api
    .post<{ success: string }>("/messages", {
      channelId,
      senderUsername,
      content,
      sentAt: new Date().toISOString(),
    })
    .then((r) => r.data);
