import type { PresenceStatusResponse } from "../models/http-types";

import api from "../client/axios";

export const getUsersPresenceStatus = (userIds: string[]) =>
  api.post<PresenceStatusResponse>("/presence/status", { userIds }).then((r) => r.data);
