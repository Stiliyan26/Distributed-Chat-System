import api from "../client/axios";
import type { PresenceStatusResponse } from "../models/http-types";

export const getUsersPresenceStatus = (userIds: string[]) =>
  api.post<PresenceStatusResponse>("/presence/status", { userIds }).then((r) => r.data);
