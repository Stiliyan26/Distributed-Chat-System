import api from "@/shared/api/axios";
import type { PresenceStatusResponse } from "@/shared/types";

export const getUsersPresenceStatus = (userIds: string[]) =>
  api.post<PresenceStatusResponse>("/presence/status", { userIds }).then((r) => r.data);
